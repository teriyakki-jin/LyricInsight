import pandas as pd
from collections import Counter, defaultdict
import re
from pathlib import Path
import json

IN_PATH = Path("../data/KPoEM_line_dataset_v4.tsv")
OUT_PATH = Path("../data/emotion_lexicon.json")

def split_labels(s):
    if pd.isna(s): return []
    return [p.strip() for p in str(s).split(",") if p.strip()]

def main():
    if not IN_PATH.exists():
        print(f"Error: {IN_PATH} not found.")
        return

    print(f"Reading {IN_PATH}...")
    # quoting=3 to handle quotes literally in TSV
    df = pd.read_csv(IN_PATH, sep='\t', quoting=3)
    
    lexicon = defaultdict(Counter)
    
    print("Processing rows...")
    annot_cols = ["annotator_01", "annotator_02", "annotator_03", "annotator_04", "annotator_05"]
    
    for _, row in df.iterrows():
        text = str(row['text'])
        # 단순 토큰화 (특수문자 제거 후 공백 분리)
        words = re.sub(r"[^\w\s]", " ", text).split()
        
        # 라벨 집계 (투표 방식 생략하고 모든 라벨 수집)
        row_labels = []
        for col in annot_cols:
            row_labels.extend(split_labels(row.get(col, "")))
        
        if not row_labels: continue
        
        for word in words:
            if len(word) < 2: continue # 1글자 단어 제외
            for label in row_labels:
                lexicon[word][label] += 1
                
    # 점수 계산 및 필터링
    processed_lexicon = {}
    for word, counts in lexicon.items():
        total = sum(counts.values())
        if total < 5: continue # 최소 출현 빈도
        
        # 상위 감정만 추출
        sorted_counts = counts.most_common(3)
        emotions = []
        for label, count in sorted_counts:
            score = round(count / total, 4)
            if score > 0.1: # 유의미한 점수만
                emotions.append({"label": label, "score": score})
        
        if emotions:
            processed_lexicon[word] = emotions

    print(f"Saving lexicon with {len(processed_lexicon)} words...")
    with OUT_PATH.open("w", encoding="utf-8") as f:
        json.dump(processed_lexicon, f, ensure_ascii=False, indent=2)
    
    print("Done!")

if __name__ == "__main__":
    main()
