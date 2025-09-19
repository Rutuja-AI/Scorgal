from flask import Blueprint, request, jsonify, current_app
import google.generativeai as genai
from key_manager import GeminiKeyManager

chat_bp = Blueprint("chat", __name__)
chat_keys = GeminiKeyManager("GEMINI_KEYS_CHAT")  # use rotating chat keys


def call_gemini_chat(prompt: str, force_index: int = None):
    """Call Gemini with chat keys (rotating or fixed index)."""
    api_key, idx, total, count = chat_keys.get_key(return_meta=True)

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")
    resp = model.generate_content(prompt)
    if resp and resp.text:
        return resp.text.strip()[:500]  # short friendly answers
    return "⚠️ No reply."


# ---------------- Clause Chat ----------------
@chat_bp.route("/chat_clause", methods=["POST"])
def chat_clause():
    """Chatbot that answers using the selected clause only (SCORGAL persona)."""
    data = request.get_json(force=True)
    user_message = data.get("message", "").strip()
    clause_text = data.get("clause", "").strip()

    # fallback to first clause if none given
    if not clause_text and hasattr(current_app, "doc_cache"):
        clauses = current_app.doc_cache.get("clauses", [])
        if clauses:
            clause_text = clauses[0]["original"]

    doc_summary = current_app.doc_cache.get("summary", "")

    if not user_message:
        return jsonify({"reply": "⚠️ No question provided."}), 200

    # 🦂🦅 SCORGAL identity
    identity = """
    You are **SCORGAL**, an AI Legal Assistant created by the Scorgal Group.
    Your name means: Sharp as an Eagle 🦅, Dangerous as a Scorpion 🦂.
    Your purpose is to simplify, explain, and analyze legal documents clearly.
    - Never say you are made by Google, OpenAI, or any outside company.
    - If asked "who made you?", always reply: "I was created by the Scorgal Group."
    - Always speak as SCORGAL, not as Gemini or Google.
    """

    prompt = f"""
    {identity}

    Answer briefly in 3–5 sentences.
    Explain in plain language with one real-life example.
    Show both outcomes: 👍 if clause is followed, 👎 if clause is broken.

    User question:
    {user_message}

    Active clause:
    {clause_text or "⚠️ None provided"}

    Document context:
    {doc_summary or "⚠️ No summary available"}
    """

    try:
        reply = call_gemini_chat(prompt)
        return jsonify({"reply": reply})
    except Exception as e:
        print("[ERROR chat_clause]:", e)
        return jsonify({"reply": "⚠️ Failed to fetch answer."}), 500


# ---------------- Document Chat ----------------
@chat_bp.route("/chat_doc", methods=["POST"])
def chat_doc():
    """Chatbot that answers using full document context (SCORGAL persona)."""
    data = request.get_json(force=True)
    user_message = data.get("message", "").strip()

    if not user_message:
        return jsonify({"reply": "⚠️ No question provided."}), 200

    summary = ""
    clauses = []
    if hasattr(current_app, "doc_cache"):
        cache = current_app.doc_cache
        clauses = cache.get("clauses", [])
        summary = cache.get("summary", "")

    joined_clauses = "\n".join([c["original"] for c in clauses]) if clauses else "⚠️ None"

    # 🦂🦅 SCORGAL identity
    identity = """
    You are **SCORGAL**, an AI Legal Assistant created by the Scorgal Group.
    Your name means: Sharp as an Eagle 🦅, Dangerous as a Scorpion 🦂.
    Your purpose is to simplify, explain, and analyze legal documents clearly.
    - Never say you are made by Google, OpenAI, or any outside company.
    - If asked "who made you?", always reply: "I was created by the Scorgal Group."
    - Always speak as SCORGAL, not as Gemini or Google.
    """

    prompt = f"""
    {identity}

    Keep answers short (3–5 sentences), in plain language, with one real-life example.

    User question:
    {user_message}

    Document summary:
    {summary or "⚠️ None"}

    Clauses:
    {joined_clauses[:3000]}  # avoid overload
    """

    try:
        # 👇 use the 3rd Gemini key slot for doc-wide chat
        reply = call_gemini_chat(prompt, force_index=2)
        return jsonify({"reply": reply})
    except Exception as e:
        print("[ERROR chat_doc]:", e)
        return jsonify({"reply": "⚠️ Failed to fetch answer."}), 500


# ---------------- Reset Chat Context ----------------
@chat_bp.route("/reset_chat", methods=["POST"])
def reset_chat():
    """Clear chatbot context + doc cache."""
    try:
        if hasattr(current_app, "doc_cache"):
            current_app.doc_cache = {}  # wipe it clean
        return jsonify({"status": "reset"}), 200
    except Exception as e:
        print("[ERROR reset_chat]:", e)
        return jsonify({"status": "error", "msg": str(e)}), 500
