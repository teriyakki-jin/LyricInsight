import json
import numpy as np
from pathlib import Path
import torch
from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSequenceClassification

BASE_DIR = Path(__file__).resolve().parent.parent  # ai/
MODEL_DIR = BASE_DIR / "models" / "emotion_kpoem"
LABELS_PATH = MODEL_DIR / "labels.json"

def sigmoid(x):
    return 1 / (1 + np.exp(-x))

labels = json.loads(LABELS_PATH.read_text(encoding="utf-8"))
tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR)
model.eval()

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

    return {"emotions": picked}
