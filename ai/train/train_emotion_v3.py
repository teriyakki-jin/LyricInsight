"""
K-Pop 가사 기반 감정 분석 모델 V3 학습 스크립트

변경점 (V2 대비):
- 데이터: KPoEM(시) -> K-Pop 가사 (GPT API 레이블링)
- 모델명: emotion_v2 -> emotion_v3
"""
import json
from pathlib import Path
import numpy as np
from sklearn.metrics import f1_score

from datasets import Dataset
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    TrainingArguments,
    Trainer,
    EarlyStoppingCallback
)

# V3 데이터 경로 (K-Pop 가사)
DATA_DIR = Path("../../data/processed_kpop")
TRAIN_PATH = DATA_DIR / "train.jsonl"
VAL_PATH = DATA_DIR / "val.jsonl"
LABELS_PATH = DATA_DIR / "labels.json"

# V3 모델 설정
MODEL_NAME = "klue/roberta-base"
OUT_MODEL_DIR = Path("../models/emotion_v3")

def load_jsonl(path: Path):
    rows = []
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            rows.append(json.loads(line))
    return rows

def sigmoid(x):
    return 1 / (1 + np.exp(-x))

def compute_metrics(eval_pred):
    logits, labels = eval_pred
    probs = sigmoid(logits)

    thr = 0.3
    preds = (probs >= thr).astype(int)

    micro = f1_score(labels, preds, average="micro", zero_division=0)
    macro = f1_score(labels, preds, average="macro", zero_division=0)

    return {
        "f1_micro": micro,
        "f1_macro": macro,
    }


def main():
    print("=" * 50)
    print("Emotion V3 Training (K-Pop Lyrics)")
    print("=" * 50)
    
    if not LABELS_PATH.exists():
        print(f"Labels file not found: {LABELS_PATH}")
        print("Please run prepare_kpop_dataset.py first.")
        return

    label_names = json.loads(LABELS_PATH.read_text(encoding="utf-8"))
    print(f"num_labels: {len(label_names)}")
    print(f"labels: {label_names[:10]}...")

    train_rows = load_jsonl(TRAIN_PATH)
    val_rows = load_jsonl(VAL_PATH)
    print(f"train samples: {len(train_rows)}, val samples: {len(val_rows)}")

    train_ds = Dataset.from_list(train_rows)
    val_ds = Dataset.from_list(val_rows)

    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

    def tokenize(batch):
        return tokenizer(
            batch["text"],
            truncation=True,
            padding="max_length",
            max_length=128,
        )

    train_ds = train_ds.map(tokenize, batched=True)
    val_ds = val_ds.map(tokenize, batched=True)

    def cast_labels(batch):
        batch["labels"] = np.array(batch["labels"], dtype=np.float32)
        return batch

    train_ds = train_ds.map(cast_labels)
    val_ds = val_ds.map(cast_labels)

    train_ds.set_format(type="torch", columns=["input_ids", "attention_mask", "labels"])
    val_ds.set_format(type="torch", columns=["input_ids", "attention_mask", "labels"])

    model = AutoModelForSequenceClassification.from_pretrained(
        MODEL_NAME,
        num_labels=len(label_names),
        problem_type="multi_label_classification",
    )

    args = TrainingArguments(
        output_dir=str(OUT_MODEL_DIR),
        eval_strategy="epoch",
        save_strategy="epoch",
        learning_rate=3e-5,
        per_device_train_batch_size=8,
        per_device_eval_batch_size=8,
        num_train_epochs=10,  # K-Pop 데이터가 적으므로 epochs 증가
        weight_decay=0.01,
        logging_steps=10,
        load_best_model_at_end=True,
        metric_for_best_model="f1_micro",
        save_total_limit=2,
    )

    trainer = Trainer(
        model=model,
        args=args,
        train_dataset=train_ds,
        eval_dataset=val_ds,
        compute_metrics=compute_metrics,
        callbacks=[EarlyStoppingCallback(early_stopping_patience=3)]
    )

    print("\n🚀 Starting training...")
    trainer.train()

    # Save model
    OUT_MODEL_DIR.mkdir(parents=True, exist_ok=True)
    trainer.save_model(str(OUT_MODEL_DIR))
    tokenizer.save_pretrained(str(OUT_MODEL_DIR))
    (OUT_MODEL_DIR / "labels.json").write_text(
        json.dumps(label_names, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )

    print(f"\n✅ Saved V3 model to: {OUT_MODEL_DIR}")

if __name__ == "__main__":
    main()
