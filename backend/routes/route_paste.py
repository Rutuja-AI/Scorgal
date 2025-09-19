# routes/route_paste.py
from flask import Blueprint, request, jsonify, current_app
from routes.route_upload import split_into_clauses, clean_text
from PIL import Image
import pytesseract, base64
import io

paste_bp = Blueprint("paste", __name__)

@paste_bp.route("/paste", methods=["POST"])
def paste_input():
    data = request.json
    text = data.get("text", "").strip()
    image_b64 = data.get("image", None)

    if text:
        # Clean + split pasted text
        text = clean_text(text)
        clauses = split_into_clauses(text)
        current_app.doc_cache = {"filename": "pasted_text", "clauses": clauses}
        return jsonify({"doc_type": "Pasted Text", "clauses": clauses})

    elif image_b64:
        try:
            # Decode base64 → PIL image
            image_data = base64.b64decode(image_b64)
            img = Image.open(io.BytesIO(image_data))

            # OCR
            extracted = pytesseract.image_to_string(img)
            extracted = clean_text(extracted)
            clauses = split_into_clauses(extracted)

            current_app.doc_cache = {"filename": "pasted_image", "clauses": clauses}
            return jsonify({"doc_type": "Pasted Image", "clauses": clauses})
        except Exception as e:
            return jsonify({"error": f"OCR failed: {e}"}), 500

    else:
        return jsonify({"error": "No text or image provided"}), 400
