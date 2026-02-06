import uvicorn
from fastapi import FastAPI
import sys

print(f"Python: {sys.executable}")

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    print("Starting uvicorn run...")
    try:
        uvicorn.run(app, host="127.0.0.1", port=8001)
    except Exception as e:
        print(f"Error: {e}")
