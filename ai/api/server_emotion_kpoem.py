import os
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
import json
import re
from collections import Counter
import numpy as np
from pathlib import Path
import torch
# from fastapi import FastAPI
# from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSequenceClassification

from fastapi import FastAPI
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent  # ai/
print("Loading imports...", flush=True)

# MODEL_DIR = BASE_DIR / "models" / "emotion_kpoem"
# MODEL_DIR = BASE_DIR / "models" / "emotion_v2"
# MODEL_DIR = BASE_DIR / "models" / "emotion_v3" / "checkpoint-50"
MODEL_DIR = BASE_DIR.parent / "emotion_v3"  # D:/lyricinsight/emotion_v3 (최신 V3 모델)
LABELS_PATH = MODEL_DIR / "labels.json"
print(f"LABELS_PATH: {LABELS_PATH}", flush=True)

def sigmoid(x):
    return 1 / (1 + np.exp(-x))

LEXICON_PATH = BASE_DIR / "data" / "emotion_lexicon.json"
print(f"LEXICON_PATH: {LEXICON_PATH}", flush=True)

def load_lexicon():
    print("Loading lexicon...", flush=True)
    if LEXICON_PATH.exists():
        try:
            with LEXICON_PATH.open("r", encoding="utf-8") as f:
                data = json.load(f)
                print(f"Lexicon loaded: {len(data)} items", flush=True)
                return data
        except Exception as e:
            print(f"Error loading lexicon: {e}", flush=True)
            return {}
    print("Lexicon file not found", flush=True)
    return {}

EMOTION_LEXICON = load_lexicon()

def extract_word_emotions(text: str):
    word_emotions = []
    # 특수문자 제거 후 토큰화
    clean_text = re.sub(r"[^\w\s]", " ", text)
    words = clean_text.split()
    
    seen_words = set()
    for word in words:
        if word in EMOTION_LEXICON and word not in seen_words:
            seen_words.add(word)
            # 해당 단어의 가장 점수가 높은 감정 하나만 대표로 선택하거나 목록 전체 사용
            # 여기서는 편의상 첫 번째(점수 높은 순)만 사용
            top_emo = EMOTION_LEXICON[word][0]
            word_emotions.append({
                "word": word,
                "emotion": top_emo["label"],
                "score": top_emo["score"],
                "explanation": f"가사에서 '{word}' 단어가 사용되어 '{top_emo['label']}'의 정서가 느껴집니다."
            })
    return word_emotions[:12]

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
            candidates.append({
                "line": line,
                "emotion": top_emo["label"],
                "score": top_emo["score"]
            })
            
    selected = sorted(candidates, key=lambda x: x["score"], reverse=True)[:3]
    
    highlights = []
    for item in selected:
        highlights.append({
            "line": item["line"],
            "meaning": f"'{item['emotion']}'의 감정이 집약적으로 표현된 구절입니다.",
            "why": f"'{item['emotion']}'과(와) 연관된 표현이 포함되어 있어 곡의 핵심 정서를 관통하고 있습니다."
        })
    return highlights

# ML 모델 로드 시도 (실패 시 무시)
HAS_MODEL = False
tokenizer = None
model = None
labels = []

try:
    if LABELS_PATH.exists():
        import torch
        from transformers import AutoTokenizer, AutoModelForSequenceClassification

        print("Loading ML model...", flush=True)
        labels = json.loads(LABELS_PATH.read_text(encoding="utf-8"))
        
        # 모델 로딩 최적화: use_safetensors=True, low_cpu_mem_usage=True
        tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR, use_safetensors=True)
        model = AutoModelForSequenceClassification.from_pretrained(
            MODEL_DIR, 
            use_safetensors=True,
            # low_cpu_mem_usage=True  # 윈도우/Torch 버전 문제 시 주석 처리 필요할 수 있음
        )
        model.eval()
        HAS_MODEL = True
        print(f"ML model loaded successfully. Labels: {len(labels)}", flush=True)
    else:
        print("Labels file not found, skipping ML model.", flush=True)
        HAS_MODEL = False
except Exception as e:
    print(f"Warning: Could not load ML model: {e}", flush=True)
    HAS_MODEL = False


app = FastAPI(title="LyricInsight Emotion(KPoEM) API")

class PredictReq(BaseModel):
    text: str
    threshold: float = 0.25
    top_k: int = 3
    max_length: int = 512

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/emotion")
def predict(req: PredictReq):
    if HAS_MODEL:
        inputs = tokenizer(
            req.text,
            return_tensors="pt",
            truncation=True,
            padding=True,
            max_length=req.max_length,
        )
        with torch.no_grad():
            logits = model(**inputs).logits.squeeze(0).cpu().numpy()

        probs = sigmoid(logits)
        pairs = sorted(zip(labels, probs), key=lambda x: x[1], reverse=True)
        picked = [{"label": l, "score": float(round(p, 4))} for l, p in pairs if p >= req.threshold]
        if not picked:
            picked = [{"label": l, "score": float(round(p, 4))} for l, p in pairs[:req.top_k]]
    else:
        # 모델이 없으면 사전 기반으로 전체 감정 예측
        picked = predict_by_lexicon(req.text)

    # 단어 별 감정 추출
    word_emotions = extract_word_emotions(req.text)
    
    # 핵심 가사 분석 추출
    highlights = extract_highlights(req.text)

    return {
        "emotions": picked,
        "word_emotions": word_emotions,
        "highlights": highlights
    }
