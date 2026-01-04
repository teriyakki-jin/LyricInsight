import json
import csv
from pathlib import Path

IN_PATH = Path("../data/raw/clean_wikisource.jsonl")
OUT_PATH = Path("../data/labeled/label_sheet.csv")
OUT_PATH.parent.mkdir(parents=True, exist_ok=True)

rows = []
with IN_PATH.open("r", encoding="utf-8") as f:
    for i, line in enumerate(f, 1):
        it = json.loads(line)
        rows.append({
            "id": i,
            "title": it.get("title", ""),
            "text": it.get("text", ""),
            "emotions": "",  # 예: 슬픔,체념
            "themes": ""     # 예: 이별,사랑
        })

with OUT_PATH.open("w", encoding="utf-8-sig", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["id", "title", "text", "emotions", "themes"])
    writer.writeheader()
    writer.writerows(rows)

print("saved:", OUT_PATH)
