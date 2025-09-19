from flask import Blueprint, request, jsonify, current_app
import google.generativeai as genai
from key_manager import GeminiKeyManager

chat_global_bp = Blueprint("chat_global", __name__)
chat_keys = GeminiKeyManager("GEMINI_KEYS_CHAT")  # reuse chat keys

def call_gemini_chat(prompt: str):
    """Call Gemini with chat keys (rotating if needed)."""
    api_key, idx, total, count = chat_keys.get_key(return_meta=True)
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")
    resp = model.generate_content(prompt)
    if resp and resp.text:
        return resp.text.strip()
    return "⚠️ No reply."

@chat_global_bp.route("/chat_global", methods=["POST"])
def chat_global():
    data = request.get_json(force=True)
    user_message = data.get("message", "").strip()

    # Context → summary or all clauses
    doc_summary = current_app.doc_cache.get("summary", "")
    clauses = current_app.doc_cache.get("clauses", [])

    if not doc_summary and clauses:
        # fallback: join first few clauses (limit length)
        doc_summary = " ".join([c.get("original", "") for c in clauses[:5]])[:1500]

    if not user_message:
        return jsonify({"reply": "⚠️ No question provided."}), 200

    prompt = f"""
    You are SCORGAL, a friendly legal assistant. 
    The user asked: {user_message}

    Full document context (summary or first clauses):
    {doc_summary or "⚠️ No summary available"}

    Answer simply and clearly, with real-world examples if useful.
    """

    try:
        reply = call_gemini_chat(prompt)
        return jsonify({"reply": reply})
    except Exception as e:
        print("[ERROR chat_global]:", e)
        return jsonify({"reply": "⚠️ Failed to fetch answer."}), 500
