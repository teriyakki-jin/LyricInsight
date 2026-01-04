import csv, json
from pathlib import Path

CSV_PATH = Path("../data/labeled/label_sheet.csv")
OUT_JSONL = Path("../data/labeled/labeled_poems.jsonl")
OUT_JSONL.parent.mkdir(parents=True, exist_ok=True)

def split_tags(s: str):
    return [x.strip() for x in s.split(",") if x.strip()]

with CSV_PATH.open("r", encoding="utf-8-sig") as f, OUT_JSONL.open("w", encoding="utf-8") as out:
    r = csv.DictReader(f)
    for row in r:
        emotions = split_tags(row.get("emotions", ""))
        themes = split_tags(row.get("themes", ""))

        # 라벨이 하나도 없으면 스킵(미라벨)
        if not emotions and not themes:
            continue

        item = {
            "id": int(row["id"]),
            "title": row.get("title", ""),
            "text": row.get("text", ""),
            "labels": {
                "summary": [],
                "emotions": [{"label": e, "score": 1.0} for e in emotions],  # 점수는 일단 1.0 고정
                "themes": themes,
                "highlights": []
            }
        }
        out.write(json.dumps(item, ensure_ascii=False) + "\n")

print("saved:", OUT_JSONL)
