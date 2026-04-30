import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def list_models():
    print("Beschikbare modellen:")
    try:
        for model in client.models.list():
            print(f"- {model.name}")
    except Exception as e:
        print(f"Fout bij ophalen modellen: {e}")

if __name__ == "__main__":
    list_models()
