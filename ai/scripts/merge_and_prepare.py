# -*- coding: utf-8 -*-
"""
KPoEM + K-POP 가사 데이터 병합 및 학습 데이터 준비
"""

import json
import random
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR.parent / "data"

# 입력 파일
KPOEM_PATH = DATA_DIR / "labeled" / "kpoem_emotion.jsonl"
KPOP_PATH = DATA_DIR / "labeled" / "kpop_lyrics_labeled.jsonl"
LABELS_PATH = DATA_DIR / "processed_kpoem" / "labels.json"

# 출력 디렉토리
OUTPUT_DIR = DATA_DIR / "processed_merged"


def load_jsonl(path: Path) -> list:
    """JSONL 파일 로드"""
    rows = []
    if not path.exists():
        return rows
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def convert_to_training_format(item: dict, labels: list) -> dict:
    """학습 형식으로 변환 (multi-label binary vector)"""
    text = item["text"]

    # 감정 레이블 추출
    emotions = []
    if "labels" in item and "emotions" in item["labels"]:
        emotions = [e["label"] for e in item["labels"]["emotions"]]

    # Multi-label binary vector 생성
    label_vector = [1.0 if label in emotions else 0.0 for label in labels]

    return {
        "text": text,
        "labels": label_vector
    }


def main():
    # 레이블 로드
    labels = json.loads(LABELS_PATH.read_text(encoding="utf-8"))
    print(f"레이블 수: {len(labels)}")

    # 데이터 로드
    kpoem_data = load_jsonl(KPOEM_PATH)
    kpop_data = load_jsonl(KPOP_PATH)

    print(f"KPoEM 데이터: {len(kpoem_data)}개")
    print(f"K-POP 가사 데이터: {len(kpop_data)}개")

    # 병합
    all_data = kpoem_data + kpop_data
    print(f"총 데이터: {len(all_data)}개")

    # 학습 형식으로 변환
    converted = []
    for item in all_data:
        try:
            converted.append(convert_to_training_format(item, labels))
        except Exception as e:
            print(f"변환 오류: {e}")
            continue

    print(f"변환 완료: {len(converted)}개")

    # 셔플
    random.seed(42)
    random.shuffle(converted)

    # Train/Val 분할 (80/20)
    split_idx = int(len(converted) * 0.8)
    train_data = converted[:split_idx]
    val_data = converted[split_idx:]

    print(f"Train: {len(train_data)}개")
    print(f"Val: {len(val_data)}개")

    # 저장
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    train_path = OUTPUT_DIR / "train.jsonl"
    val_path = OUTPUT_DIR / "val.jsonl"
    labels_out_path = OUTPUT_DIR / "labels.json"

    with train_path.open("w", encoding="utf-8") as f:
        for i, item in enumerate(train_data):
            item["id"] = i + 1
            f.write(json.dumps(item, ensure_ascii=False) + "\n")

    with val_path.open("w", encoding="utf-8") as f:
        for i, item in enumerate(val_data):
            item["id"] = i + 1
            f.write(json.dumps(item, ensure_ascii=False) + "\n")

    labels_out_path.write_text(
        json.dumps(labels, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )

    print(f"\n저장 완료:")
    print(f"  - {train_path}")
    print(f"  - {val_path}")
    print(f"  - {labels_out_path}")


if __name__ == "__main__":
    main()
