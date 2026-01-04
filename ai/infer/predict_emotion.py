import json
import numpy as np
from pathlib import Path
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

MODEL_DIR = Path("../models/emotion")
#MODEL_DIR = Path("../models/emotion/checkpoint-230")
LABELS_PATH = MODEL_DIR / "labels.json"

def sigmoid(x):
    return 1 / (1 + np.exp(-x))

def load():
    labels = json.loads(LABELS_PATH.read_text(encoding="utf-8"))
    tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR)
    model.eval()
    return labels, tokenizer, model

def predict(text: str, threshold=0.5, top_k=3):
    labels, tokenizer, model = load()

    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=256)
    with torch.no_grad():
        logits = model(**inputs).logits.squeeze(0).cpu().numpy()

    probs = sigmoid(logits)
    pairs = list(zip(labels, probs))
    pairs.sort(key=lambda x: x[1], reverse=True)

    picked = [{"label": l, "score": float(round(p, 4))} for l, p in pairs if p >= threshold]
    if not picked:
        picked = [{"label": l, "score": float(round(p, 4))} for l, p in pairs[:top_k]]

    return picked

if __name__ == "__main__":
    sample = """"""
    print(predict(sample, threshold=0.5))
