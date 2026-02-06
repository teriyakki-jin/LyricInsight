import sys
print(f"Python: {sys.executable}")
print("Importing server_emotion_kpoem...")
try:
    import server_emotion_kpoem
    print("Import success")
except Exception as e:
    print(f"Import failed: {e}")
