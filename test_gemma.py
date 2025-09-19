import requests
import os

# Replace with your Google Cloud API key
API_KEY = "AIzaSyDTNP_2MbO8YgWYmc9ZwzOxgNIJwUQ9MvM"

def translate_to_hindi(text: str):
    url = f"https://translation.googleapis.com/language/translate/v2?key={API_KEY}"
    payload = {
        "q": text,
        "target": "hi",   # Hindi
        "format": "text"
    }
    response = requests.post(url, json=payload)
    if response.status_code == 200:
        result = response.json()
        translated = result["data"]["translations"][0]["translatedText"]
        return translated
    else:
        print("Error:", response.text)
        return None

if __name__ == "__main__":
    text = "This is a test for SCORGAL translation system."
    translated = translate_to_hindi(text)
    print("Original:", text)
    print("Hindi Translation:", translated)
