import os
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
print("Setting env var...")

try:
    print("Importing torch...")
    import torch
    print(f"Torch version: {torch.__version__}")
    
    print("Importing transformers...")
    from transformers import AutoTokenizer, AutoModelForSequenceClassification
    print("Transformers imported.")
    
    MODEL_DIR = "d:/LyricInsight/ai/models/emotion_kpoem"
    print(f"Loading model from {MODEL_DIR}...")
    
    tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
    print("Tokenizer loaded.")
    
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR, use_safetensors=True)
    print("Model loaded.")
    
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()

print("Done.")
