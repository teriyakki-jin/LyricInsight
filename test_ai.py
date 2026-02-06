import requests
import json

url = "http://127.0.0.1:8001/emotion"
data = {
    "text": "사랑해 너를 사랑해",
    "threshold": 0.25,
    "top_k": 3
}

try:
    res = requests.post(url, json=data)
    print("Status:", res.status_code)
    print("Body:", res.text)
except Exception as e:
    print("Error:", e)
