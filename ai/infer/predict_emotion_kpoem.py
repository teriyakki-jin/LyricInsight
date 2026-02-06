import json
import re
from collections import Counter
import numpy as np
from pathlib import Path
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

MODEL_DIR = Path("../models/emotion_kpoem")
LABELS_PATH = MODEL_DIR / "labels.json"

LEXICON_PATH = Path("../data/emotion_lexicon.json")

def load_lexicon():
    if LEXICON_PATH.exists():
        with LEXICON_PATH.open("r", encoding="utf-8") as f:
            return json.load(f)
    return {}

EMOTION_LEXICON = load_lexicon()

def extract_word_emotions(text: str):
    word_emotions = []
    clean_text = re.sub(r"[^\w\s]", " ", text)
    words = clean_text.split()
    seen_words = set()
    for word in words:
        if word in EMOTION_LEXICON and word not in seen_words:
            seen_words.add(word)
            top_emo = EMOTION_LEXICON[word][0]
            word_emotions.append({
                "word": word,
                "emotion": top_emo["label"],
                "score": top_emo["score"],
                "explanation": f"가사에서 '{word}' 단어가 사용되어 '{top_emo['label']}'의 정서가 느껴집니다."
            })
    return word_emotions[:12]

def extract_highlights(text: str):
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    candidates = []
    for line in lines:
        clean_line = re.sub(r"[^\w\s]", " ", line)
        words = clean_line.split()
        line_emotions = []
        for word in words:
            if word in EMOTION_LEXICON:
                line_emotions.append(EMOTION_LEXICON[word][0])
        if line_emotions:
            top_emo = sorted(line_emotions, key=lambda x: x["score"], reverse=True)[0]
            candidates.append({"line": line, "emotion": top_emo["label"], "score": top_emo["score"]})
    selected = sorted(candidates, key=lambda x: x["score"], reverse=True)[:3]
    highlights = []
    for item in selected:
        highlights.append({
            "line": item["line"],
            "meaning": f"'{item['emotion']}'의 감정이 집약적으로 표현된 구절입니다.",
            "why": f"'{item['emotion']}'과(와) 연관된 표현이 포함되어 있어 곡의 핵심 정서를 관통하고 있습니다."
        })
    return highlights

def predict_by_lexicon(text: str):
    clean_text = re.sub(r"[^\w\s]", " ", text)
    words = clean_text.split()
    scores = Counter()
    for word in words:
        if word in EMOTION_LEXICON:
            for emo in EMOTION_LEXICON[word]:
                scores[emo["label"]] += emo["score"]
    total = sum(scores.values())
    if total == 0:
        return []
    results = []
    for label, score in scores.most_common(3):
        results.append({"label": label, "score": round(score / total, 4)})
    return results

def sigmoid(x):
    return 1 / (1 + np.exp(-x))

def predict(text: str, threshold=0.25, top_k=3, max_length=128):
    picked = []
    try:
        if LABELS_PATH.exists():
            print("Loading ML model...", flush=True)
            labels = json.loads(LABELS_PATH.read_text(encoding="utf-8"))
            tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR, use_safetensors=True)
            model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR, use_safetensors=True)
            model.eval()
            
            inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=max_length)
            with torch.no_grad():
                logits = model(**inputs).logits.squeeze(0).cpu().numpy()
            probs = sigmoid(logits)
            pairs = sorted(zip(labels, probs), key=lambda x: x[1], reverse=True)
            
            picked = [{"label": l, "score": float(round(p, 4))} for l, p in pairs if p >= threshold]
            if not picked:
                picked = [{"label": l, "score": float(round(p, 4))} for l, p in pairs[:top_k]]
            print("ML Prediction success")
    except Exception as e:
        print(f"ML Prediction failed: {e}", flush=True)
        picked = []

    if not picked:
        print("Fallback to Lexicon")
        picked = predict_by_lexicon(text)

    word_emotions = extract_word_emotions(text)
    highlights = extract_highlights(text)

    return {
        "emotions": picked,
        "word_emotions": word_emotions,
        "highlights": highlights
    }

if __name__ == "__main__":
    sample = "이제 30살이 된 진예빈, 담담하게 약과를 까먹는 중이다."
    print(predict(sample, threshold=0.25, top_k=3))
