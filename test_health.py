import requests

try:
    print("Testing /health...")
    res = requests.get("http://127.0.0.1:8002/health")
    print(f"GET /health: {res.status_code} {res.text}")

    print("\nTesting /emotion...")
    res = requests.post("http://127.0.0.1:8002/emotion", json={"text": "테스트", "top_k": 3})
    print(f"POST /emotion: {res.status_code} {res.text}")
except Exception as e:
    print(e)
