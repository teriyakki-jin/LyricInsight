from server_emotion_kpoem import app

print("Routes:")
for route in app.routes:
    print(f"{route.path} {route.name}")
