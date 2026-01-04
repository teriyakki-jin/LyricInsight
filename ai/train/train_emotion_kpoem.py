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
)

DATA_DIR = Path("../data/processed_kpoem")
TRAIN_PATH = DATA_DIR / "train.jsonl"
VAL_PATH = DATA_DIR / "val.jsonl"
LABELS_PATH = DATA_DIR / "labels.json"

MODEL_NAME = "monologg/koelectra-base-v3-discriminator"
OUT_MODEL_DIR = Path("../models/emotion_kpoem")

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

    # ✅ threshold 낮춰서 1차 확인
    thr = 0.3
    preds = (probs >= thr).astype(int)

    micro = f1_score(labels, preds, average="micro", zero_division=0)
    macro = f1_score(labels, preds, average="macro", zero_division=0)

    # 참고용: 예측 양성 비율(전부 0인지 체크)
    pred_pos_rate = float(preds.mean())
    true_pos_rate = float(labels.mean())

    return {
        "f1_micro": micro,
        "f1_macro": macro,
        "pred_pos_rate": pred_pos_rate,
        "true_pos_rate": true_pos_rate,
        "threshold": thr,
    }


def main():
    label_names = json.loads(LABELS_PATH.read_text(encoding="utf-8"))
    print("num_labels:", len(label_names))

    train_rows = load_jsonl(TRAIN_PATH)
    val_rows = load_jsonl(VAL_PATH)

    train_ds = Dataset.from_list(train_rows)
    val_ds = Dataset.from_list(val_rows)

    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

    def tokenize(batch):
        return tokenizer(
            batch["text"],
            truncation=True,
            padding="max_length",
            max_length=128,  # 라인 단위라 128이면 충분
        )

    train_ds = train_ds.map(tokenize, batched=True)
    val_ds = val_ds.map(tokenize, batched=True)

    # labels를 float로 보장
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
        learning_rate=2e-5,
        per_device_train_batch_size=8,   # CPU면 4~8 추천(느리면 4)
        per_device_eval_batch_size=8,
        num_train_epochs=1,              # 데이터 많아서 3부터 시작 추천
        weight_decay=0.01,
        logging_steps=50,
        load_best_model_at_end=True,
        metric_for_best_model="f1_micro",
    )

    trainer = Trainer(
        model=model,
        args=args,
        train_dataset=train_ds,
        eval_dataset=val_ds,
        compute_metrics=compute_metrics,
    )

    trainer.train()

    # 최종 저장(루트에 config/tokenizer까지)
    OUT_MODEL_DIR.mkdir(parents=True, exist_ok=True)
    trainer.save_model(str(OUT_MODEL_DIR))
    tokenizer.save_pretrained(str(OUT_MODEL_DIR))
    (OUT_MODEL_DIR / "labels.json").write_text(
        json.dumps(label_names, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )

    print("Saved model to", OUT_MODEL_DIR)

if __name__ == "__main__":
    main()
