"""
K-Pop 가사 데이터 전처리 스크립트 (V3 모델용)

입력:  ai/scripts/kpop_lyrics_labeled.jsonl (GPT API로 레이블링된 데이터)
출력:  data/processed_kpop/train.jsonl, val.jsonl, labels.json
"""
import json
from pathlib import Path
from sklearn.preprocessing import MultiLabelBinarizer
from sklearn.model_selection import train_test_split

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent
IN_PATH = SCRIPT_DIR / "kpop_lyrics_labeled_large.jsonl"  # 500개 샘플 버전
OUT_DIR = SCRIPT_DIR.parent.parent / "data" / "processed_kpop"
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
    print(f"Loading data from: {IN_PATH}")
    items = load_jsonl(IN_PATH)
    print(f"Loaded {len(items)} items")

    texts = []
    labels = []
    for it in items:
        text = it.get("text", "").strip()
        # GPT API 레이블 형식: {"labels": {"emotions": [{"label": "행복", "score": 1.0}, ...]}}
        emos = [e["label"] for e in it.get("labels", {}).get("emotions", []) if e.get("label") and e.get("label") != "없음"]
        if not text or not emos:
            continue
        texts.append(text)
        labels.append(emos)

    print(f"Valid samples: {len(texts)}")
    
    if len(texts) == 0:
        print("Error: No valid samples found!")
        return

    # MultiLabelBinarizer로 멀티핫 벡터로 변환
    mlb = MultiLabelBinarizer()
    Y = mlb.fit_transform(labels).astype("float32")
    label_names = mlb.classes_.tolist()

    print(f"Labels: {label_names}")
    print(f"Num labels: {len(label_names)}")

    # Train/Val 분리 (80/20)
    X_train, X_val, Y_train, Y_val = train_test_split(
        texts, Y, test_size=0.2, random_state=42
    )

    # JSONL 저장
    def write_jsonl(path: Path, X, Y):
        with path.open("w", encoding="utf-8") as f:
            for i, (t, y) in enumerate(zip(X, Y), 1):
                f.write(json.dumps({"id": i, "text": t, "labels": y.tolist()}, ensure_ascii=False) + "\n")

    write_jsonl(OUT_DIR / "train.jsonl", X_train, Y_train)
    write_jsonl(OUT_DIR / "val.jsonl", X_val, Y_val)

    # 라벨 목록 저장 (추론 시 필요)
    (OUT_DIR / "labels.json").write_text(
        json.dumps(label_names, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )

    print(f"\n✅ Saved to: {OUT_DIR}")
    print(f"   - train.jsonl: {len(X_train)} samples")
    print(f"   - val.jsonl: {len(X_val)} samples")
    print(f"   - labels.json: {len(label_names)} labels")

if __name__ == "__main__":
    main()
