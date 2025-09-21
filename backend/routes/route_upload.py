import os, re, io
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
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'-\s+', '', text)
    text = re.sub(r'Illustration.*LegalDesk.*', '', text, flags=re.I)
    return text.strip()

def is_valid_clause(t: str) -> bool:
    t = t.strip()
    if len(t) < MIN_CLAUSE_LENGTH:
        return False
    if re.fullmatch(r'[\d\W]+', t):
        return False
    keywords = ["shall", "means", "agreement", "party", "term", "license"]
    if not any(k in t.lower() for k in keywords):
        return False
    return True

def split_into_clauses(text: str, max_chars: int = 750):
    """
    Simple sequential splitter:
    - Reads every line until the end.
    - Splits when buffer > max_chars or line ends with '.'.
    - Guarantees multiple readable chunks.
    """
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    buffer = ""
    results = []
    counter = 1

    for line in lines:
        buffer += " " + line

        if len(buffer) >= max_chars or line.endswith("."):
            results.append({
                "id": f"clause_{counter}",
                "label": buffer[:80],
                "original": buffer.strip(),
                "explanation": "Explanation pending...",
                "risk": "Risk pending..."
            })
            buffer = ""
            counter += 1

    # leftover
    if buffer.strip():
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
    file = request.files["file"]
    filename = secure_filename(file.filename)
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    print(f"[UPLOAD] Received file: {filename}, size={os.path.getsize(filepath)} bytes")

    text = ""

    if filename.lower().endswith(".pdf"):
        try:
            with pdfplumber.open(filepath) as pdf:
                for page in pdf.pages:
                    text += page.extract_text() or ""
            print(f"[UPLOAD] PDF (plumber) extracted {len(text)} chars")
        except Exception as e:
            print(f"[ERROR] pdfplumber failed: {e}")
            text = ""

        if not text.strip():
            print("[WARN] pdfplumber found no text → using Gemini OCR fallback")
            try:
                POPPLER_PATH = r"C:\Users\RUTUJA\Downloads\Release-25.07.0-0\poppler-25.07.0\Library\bin"
                images = convert_from_path(filepath, poppler_path=POPPLER_PATH)
                for img in images:
                    img_path = os.path.join(UPLOAD_FOLDER, "temp_page.png")
                    img.save(img_path, "PNG")
                    text += gemini_ocr(img_path)
                print(f"[UPLOAD] Gemini OCR extracted {len(text)} chars")
            except Exception as e:
                print(f"[ERROR] Gemini OCR fallback failed: {e}")

    elif filename.lower().endswith(".docx"):
        doc = Document(filepath)
        text = "\n".join([p.text for p in doc.paragraphs])

    elif filename.lower().endswith((".png", ".jpg", ".jpeg")):
        text = gemini_ocr(filepath)

    else:
        return jsonify({"error": "Unsupported file type"}), 400

    text = clean_text(text)
    print(f"[UPLOAD] Extracted raw text length: {len(text)} chars")

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

    clauses = split_into_clauses(text)

    # ✅ generate summary
    summary = generate_summary(text)

    current_app.doc_cache = {"filename": filename, "clauses": clauses, "summary": summary}
    return jsonify({"doc_type": "Contract", "clauses": clauses, "summary": summary})
