import json
from pathlib import Path
from sklearn.preprocessing import MultiLabelBinarizer
from sklearn.model_selection import train_test_split
from sklearn.metrics import f1_score
import numpy as np

from datasets import Dataset
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    TrainingArguments,
    Trainer,
)

DATA_PATH = Path("../data/processed/emotion.jsonl")
MODEL_NAME = "monologg/koelectra-base-v3-discriminator"  # KoELECTRA

def load_jsonl(path: Path):
    rows = []
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            rows.append(json.loads(line))
    return rows

def compute_metrics(eval_pred):
    logits, labels = eval_pred
    probs = 1 / (1 + np.exp(-logits))  # sigmoid
    preds = (probs >= 0.5).astype(int)

    micro = f1_score(labels, preds, average="micro", zero_division=0)
    macro = f1_score(labels, preds, average="macro", zero_division=0)
    return {"f1_micro": micro, "f1_macro": macro}

def main():
    rows = load_jsonl(DATA_PATH)
    texts = [r["text"] for r in rows]
    y = [r["labels"] for r in rows]

    mlb = MultiLabelBinarizer()
    Y = mlb.fit_transform(y).astype("float32")
    label_names = list(mlb.classes_)
    print("labels:", label_names)

    X_train, X_val, Y_train, Y_val = train_test_split(
        texts, Y, test_size=0.2, random_state=42
    )

    train_ds = Dataset.from_dict({"text": X_train, "labels": Y_train})
    val_ds = Dataset.from_dict({"text": X_val, "labels": Y_val})

    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

    def tokenize(batch):
        return tokenizer(
            batch["text"],
            truncation=True,
            padding="max_length",
            max_length=256,
        )

    train_ds = train_ds.map(tokenize, batched=True)
    val_ds = val_ds.map(tokenize, batched=True)

    model = AutoModelForSequenceClassification.from_pretrained(
        MODEL_NAME,
        num_labels=len(label_names),
        problem_type="multi_label_classification",
    )

    args = TrainingArguments(
        output_dir="../models/emotion",
        eval_strategy="epoch",
        save_strategy="epoch",
        learning_rate=2e-5,
        per_device_train_batch_size=4,   # 느리면 2로
        per_device_eval_batch_size=4,
        num_train_epochs=5,
        weight_decay=0.01,
        logging_steps=10,
        load_best_model_at_end=True,
        metric_for_best_model="f1_micro",
    )

    trainer = Trainer(
        model=model,
        args=args,
        train_dataset=train_ds,
        eval_dataset=val_ds,
        tokenizer=tokenizer,
        compute_metrics=compute_metrics,
    )

    trainer.train()

    trainer.save_model("../models/emotion")
    tokenizer.save_pretrained("../models/emotion")
    model.config.save_pretrained("../models/emotion")


# 라벨 이름 저장(추론 때 필요)
    Path("../models/emotion").mkdir(parents=True, exist_ok=True)
    (Path("../models/emotion") / "labels.json").write_text(
        json.dumps(label_names, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )

    print("Saved model to ../models/emotion")

if __name__ == "__main__":
    main()
