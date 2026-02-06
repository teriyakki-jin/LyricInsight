import requests
import json

url = "http://localhost:8002/emotion"
data = {"text": "눈물이 멈추지 않아 너를 보낼 수가 없어"}
headers = {"Content-Type": "application/json"}

try:
    response = requests.post(url, json=data, headers=headers)
    response.raise_for_status()
    result = response.json()
    print("Status Code:", response.status_code)
    print("Response JSON:")
    print(json.dumps(result, indent=2, ensure_ascii=False))
except Exception as e:
    print("Error:", e)
    if 'response' in locals():
        print("Response content:", response.text)
