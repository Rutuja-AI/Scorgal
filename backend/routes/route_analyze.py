from flask import Blueprint, request, jsonify, current_app
import google.generativeai as genai
from key_manager import GeminiKeyManager
import json
import time

# -----------------------------
# Blueprint + KeyManager
# -----------------------------
analyze_bp = Blueprint("analyze", __name__)
key_manager = GeminiKeyManager()

# -----------------------------
# Gemini Call Helper
# -----------------------------
def call_gemini(prompt: str):
    """Call Gemini API with auto-rotation on quota/invalid key errors."""
    for attempt in range(len(key_manager.keys)):  # try all keys at most once
        try:
            api_key, idx, total, count = key_manager.get_key(return_meta=True)
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(prompt)

            if response and response.text:
                text = response.text.strip()

                # 🚀 Clean markdown fences if present
                if text.startswith("```"):
                    text = text.strip("`")
                    text = text.replace("json", "", 1)
                    text = text.strip()

                try:
                    parsed = json.loads(text)
                    return parsed, f"Gemini (key {idx}/{total}, {count} calls)"
                except Exception:
                    print("[WARN] Gemini returned non-JSON output:", text[:120])
                    return text, f"Gemini (key {idx}/{total}, {count} calls)"

        except Exception as e:
            msg = str(e).lower()
            if "429" in msg or "quota" in msg:
                print(f"[WARN] Gemini quota exceeded on key {idx} → rotating…")
                key_manager.rotate_key()
                continue
            elif "api key not valid" in msg or "invalid" in msg:
                print(f"[WARN] Gemini invalid key {idx} → rotating…")
                key_manager.rotate_key()
                continue
            else:
                print(f"[WARN] Gemini failed: {e}")
                break

    # 🚨 If all keys fail → fallback
    return {
        "en": "⚠️ No response",
        "hi": "⚠️ कोई उत्तर नहीं",
        "mr": "⚠️ प्रतिसाद नाही"
    }, "None"



# -----------------------------
# Safe extractor for lang fields
# -----------------------------
def safe_extract(data, field):
    """
    Ensure we always return a dict {en, hi, mr}.
    - If data is dict → return data[field].
    - If data is JSON string → parse and return field.
    - Else → replicate raw text across all langs.
    """
    if isinstance(data, dict):
        return data.get(field, {})
    if isinstance(data, str) and data.strip().startswith("{"):
        try:
            parsed = json.loads(data)
            return parsed.get(field, {})
        except Exception:
            pass
    return {"en": str(data), "hi": str(data), "mr": str(data)}


# -----------------------------
# Main Route
# -----------------------------
@analyze_bp.route("/analyze_clause", methods=["POST"])
def analyze_clause():
    data = request.get_json(silent=True) or {}
    print("[DEBUG] Incoming JSON:", data)

    clause_id = data.get("clause_id")
    text = data.get("text", "")
    filename = (
        current_app.doc_cache.get("filename")
        if hasattr(current_app, "doc_cache")
        else "unknown"
    )

    # -----------------------------
    # Empty clause guard
    # -----------------------------
    if not text.strip():
        return jsonify({
            "id": clause_id or "unknown",
            "original": text,
            "explanation": {
                "en": "⚠️ Empty clause",
                "hi": "⚠️ खाली क्लॉज",
                "mr": "⚠️ रिकामी क्लॉज"
            },
            "risk": {
                "en": "⚠️ Empty clause",
                "hi": "⚠️ खाली क्लॉज",
                "mr": "⚠️ रिकामी क्लॉज"
            },
            "model_used": "None"
        }), 200

    # -----------------------------
    # Try MongoDB cache first
    # -----------------------------
    try:
        existing = current_app.clauses_collection.find_one(
            {"doc": filename, "id": clause_id},
            {"_id": 0}
        )
        if existing:
            print(f"[DEBUG] Cache hit for {clause_id} from MongoDB")
            return jsonify(existing)
    except Exception as e:
        print(f"[WARN] MongoDB unavailable → skipping cache check: {e}")

    # -----------------------------
    # Step 1: Ask Gemini for Explanation + Risk in all 3 languages
    # -----------------------------
    explanation_prompt = f"""
    You are a multilingual assistant.
    Explain this legal clause in **English, Hindi, and Marathi**.
    Each language MUST be a correct translation, not repeated English.
    Return ONLY valid JSON in this format:

    {{
      "explanation": {{
        "en": "English explanation here",
        "hi": "Hindi explanation here",
        "mr": "Marathi explanation here"
      }}
    }}

    Clause:
    {text}
    """

    risk_prompt = f"""
    You are a multilingual assistant.
    List risks in this clause in **English, Hindi, and Marathi**.
    If none, say "No significant risks" in each language.
    Each language MUST be a correct translation, not repeated English.
    Return ONLY valid JSON in this format:

    {{
      "risk": {{
        "en": "English risk here",
        "hi": "Hindi risk here",
        "mr": "Marathi risk here"
      }}
    }}

    Clause:
    {text}
    """

    explanation_json, model_used = call_gemini(explanation_prompt)
    risk_json, _ = call_gemini(risk_prompt)

    # -----------------------------
    # Step 2: Flatten Gemini output (with safe_extract)
    # -----------------------------
    explanation = safe_extract(explanation_json, "explanation")
    risk = safe_extract(risk_json, "risk")

    # -----------------------------
    # Step 3: Final result
    # -----------------------------
    result = {
        "doc": filename,
        "id": clause_id,
        "original": text,
        "explanation": explanation,
        "risk": risk,
        "model_used": model_used,
    }

    # Save to Mongo if available
    try:
        current_app.clauses_collection.update_one(
            {"doc": filename, "id": clause_id},
            {"$set": result},
            upsert=True,
        )
        print(f"[DEBUG] Analyzed {clause_id} → saved to MongoDB with {model_used}")
    except Exception as e:
        print(f"[WARN] Could not save to MongoDB: {e}")

    result.pop("doc", None)
    return jsonify(result)
