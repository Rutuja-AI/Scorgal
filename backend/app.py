from flask import Flask, send_from_directory
from flask_cors import CORS
from pymongo import MongoClient
import os

app = Flask(__name__)

# ✅ Enable CORS
CORS(
    app,
    resources={r"/*": {"origins": "https://scorgal.vercel.app"}},
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "OPTIONS"]
)


# ✅ Global cache
app.doc_cache = {
    "filename": None,
    "clauses": {},
    "summary": None
}

# ✅ MongoDB connection (use env variable if available, else fallback to local)
mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
client = MongoClient(mongo_uri)
db = client["scorgal"]
clauses_collection = db["clauses"]

# ✅ Import routes after attaching cache + db
from routes.route_upload import upload_bp
from routes.route_analyze import analyze_bp
from routes.route_chat import chat_bp   # 👈 NEW
from routes.route_chat_global import chat_global_bp

app.register_blueprint(upload_bp)
app.register_blueprint(analyze_bp)
app.register_blueprint(chat_bp)
app.register_blueprint(chat_global_bp)

# Make db available in blueprints
app.clauses_collection = clauses_collection

# ✅ Serve frontend (dist folder)
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    static_dir = os.path.join(os.path.dirname(__file__), "static")
    if path != "" and os.path.exists(os.path.join(static_dir, path)):
        return send_from_directory(static_dir, path)
    else:
        return send_from_directory(static_dir, "index.html")

if __name__ == "__main__":
    print("[DEBUG] SCORGAL backend starting...")
    app.run(debug=True)
