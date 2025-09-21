import os, re
import pdfplumber
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from pdf2image import convert_from_path
from docx import Document
from PIL import Image

# ✅ Gemini
import google.generativeai as genai
from key_manager import GeminiKeyManager

# ------------------ Config ------------------
UPLOAD_FOLDER = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

MAX_CLAUSE_LENGTH = 1000
MIN_CLAUSE_LENGTH = 40

upload_bp = Blueprint("upload", __name__)

# Different key managers
summ_keys = GeminiKeyManager("GEMINI_KEYS")        # summaries + analysis
ocr_keys = GeminiKeyManager("GEMINI_KEYS_OCR")     # OCR dedicated pool

# ------------------ Helpers ------------------

def clean_text(text: str) -> str:
    """Normalize extracted text for consistency."""
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'-\s+', '', text)  # join broken words
    text = re.sub(r'Illustration.*LegalDesk.*', '', text, flags=re.I)  # remove watermark
    return text.strip()

def is_valid_clause(t: str) -> bool:
    """Check if a chunk looks like a real legal clause."""
    t = t.strip()
    if len(t) < MIN_CLAUSE_LENGTH:
        return False
    if re.fullmatch(r'[\d\W]+', t):  # only numbers/symbols
        return False
    keywords = ["shall", "means", "agreement", "party", "term", "license"]
    if not any(k in t.lower() for k in keywords):
        return False
    return True

def split_into_clauses(text: str, max_chars: int = 750):
    """
    Split text into smaller readable clauses:
    - Break on '.', ';', or ':' followed by a capital letter.
    - Enforce max_chars per chunk.
    """
    parts = re.split(r'(?<=[.;:])\s+(?=[A-Z])', text)

    buffer, results = "", []
    counter = 1

    for part in parts:
        if not part.strip():
            continue
        buffer += " " + part.strip()

        if len(buffer) >= max_chars:
            if is_valid_clause(buffer):
                results.append({
                    "id": f"clause_{counter}",
                    "label": buffer[:80],
                    "original": buffer.strip(),
                    "explanation": "Explanation pending...",
                    "risk": "Risk pending..."
                })
                counter += 1
            buffer = ""

    if buffer.strip() and is_valid_clause(buffer):
        results.append({
            "id": f"clause_{counter}",
            "label": buffer[:80],
            "original": buffer.strip(),
            "explanation": "Explanation pending...",
            "risk": "Risk pending..."
        })

    print(f"[UPLOAD] Clauses generated: {len(results)}")
    return results

def gemini_ocr(image_path: str) -> str:
    """Extract text from scanned images or PDFs using Gemini Vision API (OCR keys)."""
    try:
        api_key = ocr_keys.get_key()  # ✅ use OCR pool
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")

        with open(image_path, "rb") as f:
            image_bytes = f.read()

        response = model.generate_content([
            {"mime_type": "image/png", "data": image_bytes},
            "Extract all readable text from this legal/official document image."
        ])

        if response and response.text:
            print(f"[OCR] Gemini extracted {len(response.text)} chars")
            return clean_text(response.text)

    except Exception as e:
        print(f"[ERROR] Gemini OCR failed: {e}")
    return ""

def generate_summary(text: str) -> str:
    """Use Gemini to generate a short summary of the doc."""
    try:
        api_key = summ_keys.get_key()
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        resp = model.generate_content(f"Summarize this legal/official document in 5 concise lines:\n{text[:4000]}")
        if resp and resp.text:
            return resp.text.strip()
    except Exception as e:
        print(f"[WARN] Summary generation failed: {e}")
    return "⚠️ Summary not available."

# ------------------ Routes ------------------

@upload_bp.route("/upload", methods=["POST"])
def upload_file():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    print(f"[UPLOAD] Received file: {filename}, size={os.path.getsize(filepath)} bytes")

    text = ""

    # --- PDF Handling ---
    if filename.lower().endswith(".pdf"):
        try:
            with pdfplumber.open(filepath) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text() or ""
                    text += page_text + "\n"
            print(f"[UPLOAD] PDF (plumber) extracted {len(text)} chars")
        except Exception as e:
            print(f"[ERROR] pdfplumber failed: {e}")
            text = ""

        # If no text → try OCR (Linux safe)
        if not text.strip():
            print("[WARN] pdfplumber found no text → using Gemini OCR fallback")
            try:
                images = convert_from_path(filepath)  # no hardcoded path
                for img in images:
                    img_path = os.path.join(UPLOAD_FOLDER, "temp_page.png")
                    img.save(img_path, "PNG")
                    text += gemini_ocr(img_path)
                print(f"[UPLOAD] Gemini OCR extracted {len(text)} chars")
            except Exception as e:
                print(f"[ERROR] Gemini OCR fallback failed: {e}")

    # --- DOCX Handling ---
    elif filename.lower().endswith(".docx"):
        doc = Document(filepath)
        text = "\n".join([p.text for p in doc.paragraphs])

    # --- Image Handling ---
    elif filename.lower().endswith((".png", ".jpg", ".jpeg")):
        text = gemini_ocr(filepath)

    else:
        return jsonify({"error": "Unsupported file type"}), 400

    text = clean_text(text)
    print(f"[UPLOAD] Extracted raw text length: {len(text)} chars")

    # Fallback if no text
    if not text.strip():
        print("[WARN] No text found → returning dummy clause for fallback")
        clauses = [{
            "id": "clause_0",
            "label": "⚠️ OCR failed",
            "original": "No readable text found in this file.",
            "explanation": "Explanation pending...",
            "risk": "Risk pending..."
        }]
        current_app.doc_cache = {"filename": filename, "clauses": clauses, "summary": ""}
        return jsonify({"doc_type": "Image", "clauses": clauses, "summary": ""})

    # Split & summarize
    clauses = split_into_clauses(text)
    summary = generate_summary(text)

    current_app.doc_cache = {"filename": filename, "clauses": clauses, "summary": summary}
    return jsonify({"doc_type": "Contract", "clauses": clauses, "summary": summary})
