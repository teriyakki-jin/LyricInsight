import json
import re
from collections import Counter
from pathlib import Path

import pandas as pd
from datasets import load_dataset

OUT_PATH = Path("../data/labeled/kpoem_emotion.jsonl")
OUT_PATH.parent.mkdir(parents=True, exist_ok=True)

# KPoEM v4 line-level TSV (HF에 업로드된 경로) :contentReference[oaicite:2]{index=2}
HF_TSV = r"d:\LyricInsight\ai\data\KPoEM_line_dataset_v4.tsv"

ANNOT_COLS = ["annotator_01", "annotator_02", "annotator_03", "annotator_04", "annotator_05"]

def split_labels(s: str):
    if s is None:
        return []
    s = str(s).strip()
    if not s:
        return []
    # 라벨이 "감동/감탄, 비장함" 같은 형태. 쉼표 기준 분리.
    parts = [p.strip() for p in s.split(",")]
    return [p for p in parts if p]

def aggregate_labels(row, vote_threshold=2):
    # 5명 라벨을 카운트해서 vote>=threshold만 채택
    c = Counter()
    for col in ANNOT_COLS:
        for lab in split_labels(row.get(col, "")):
            c[lab] += 1
    labels = [lab for lab, cnt in c.items() if cnt >= vote_threshold]
    # 아무것도 없으면(드물지만) 최다 득표 1개라도 넣기
    if not labels and len(c) > 0:
        labels = [c.most_common(1)[0][0]]
    return labels

def main():
    ds = load_dataset(
        "csv",
        data_files={"train": HF_TSV},
        delimiter="\t",
        encoding="utf-8",
        quoting=3,
    )
    df = ds["train"].to_pandas()

    out_lines = []
    for i, row in enumerate(df.to_dict(orient="records"), 1):
        text = str(row.get("text", "")).strip()
        if len(text) < 2:
            continue

        labels = aggregate_labels(row, vote_threshold=2)  # ✅ 추천: vote>=2
        if not labels:
            continue

        out_item = {
            "id": i,
            "text": text,
            "meta": {
                "poem_id": row.get("poem_id"),
                "title": row.get("title"),
                "poet": row.get("poet"),
            },
            "labels": {
                "emotions": [{"label": lab, "score": 1.0} for lab in labels]
            }
        }
        out_lines.append(json.dumps(out_item, ensure_ascii=False))

    OUT_PATH.write_text("\n".join(out_lines), encoding="utf-8")
    print("saved:", OUT_PATH)
    print("count:", len(out_lines))

if __name__ == "__main__":
    main()
