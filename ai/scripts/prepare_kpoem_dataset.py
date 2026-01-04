import json
from pathlib import Path
from sklearn.preprocessing import MultiLabelBinarizer
from sklearn.model_selection import train_test_split
import numpy as np

IN_PATH = Path("../data/labeled/kpoem_emotion.jsonl")
OUT_DIR = Path("../data/processed_kpoem")
OUT_DIR.mkdir(parents=True, exist_ok=True)

def load_jsonl(path: Path):
    items = []
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            items.append(json.loads(line))
    return items

def main():
    items = load_jsonl(IN_PATH)

    texts = []
    labels = []
    for it in items:
        text = it.get("text", "").strip()
        emos = [e["label"] for e in it.get("labels", {}).get("emotions", []) if e.get("label")]
        if not text or not emos:
            continue
        texts.append(text)
        labels.append(emos)

    mlb = MultiLabelBinarizer()
    Y = mlb.fit_transform(labels).astype("float32")
    label_names = mlb.classes_.tolist()

    X_train, X_val, Y_train, Y_val = train_test_split(
        texts, Y, test_size=0.2, random_state=42
    )

    # jsonl 저장(Trainer에서 그대로 씀)
    def write_jsonl(path: Path, X, Y):
        with path.open("w", encoding="utf-8") as f:
            for i, (t, y) in enumerate(zip(X, Y), 1):
                f.write(json.dumps({"id": i, "text": t, "labels": y.tolist()}, ensure_ascii=False) + "\n")

    write_jsonl(OUT_DIR / "train.jsonl", X_train, Y_train)
    write_jsonl(OUT_DIR / "val.jsonl", X_val, Y_val)

    # 라벨 목록 저장(추론 때 필요)
    (OUT_DIR / "labels.json").write_text(
        json.dumps(label_names, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )

    print("saved:", OUT_DIR)
    print("train:", len(X_train), "val:", len(X_val), "num_labels:", len(label_names))

if __name__ == "__main__":
    main()
