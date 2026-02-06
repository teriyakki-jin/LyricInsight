from server_emotion_kpoem import app
import uvicorn

if __name__ == "__main__":
    print("Starting server on port 8002...")
    try:
        uvicorn.run(app, host="127.0.0.1", port=8002)
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()
