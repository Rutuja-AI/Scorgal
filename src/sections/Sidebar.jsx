import { useState, useEffect } from "react";
import UploadBox from "./UploadBox";

export default function Sidebar({
  onSelectClause,
  lang,
  setLang,
  setLoadingState,
  setDocSummary,
  clearClauseChat,   // 🔹 NEW
  clearGlobalChat    // 🔹 NEW
}) {
  const [clauses, setClauses] = useState([]);
  const [docType, setDocType] = useState("Unknown");
  const [activeIdx, setActiveIdx] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  // Load cached doc + lang
  useEffect(() => {
    const saved = localStorage.getItem("scorgal_doc");
    if (saved) {
      const parsed = JSON.parse(saved);
      setClauses(parsed.clauses || []);
      setDocType(parsed.doc_type || "Unknown");
      if (parsed.summary) setDocSummary(parsed.summary);
      setProgress(
        (parsed.clauses || []).filter(
          (c) => c.explanation !== "Explanation pending..."
        ).length
      );
    }
    const savedLang = localStorage.getItem("scorgal_lang");
    if (savedLang) {
      setLang(savedLang);
    }
  }, []);

  // Handle upload response
  const handleUpload = (data) => {
    setUploading(false);
    setClauses(data.clauses || []);
    setDocType(data.doc_type || "Unknown");
    setProgress(0);
    if (data.summary) setDocSummary(data.summary);
    localStorage.setItem("scorgal_doc", JSON.stringify(data));
    alert(`✅ Upload successful! Found ${data.clauses.length} clauses.`);
  };

  // Analyze clause
  const analyzeClause = async (c, idx) => {
    if (!c || !c.original) return;
    if (c.explanation !== "Explanation pending...") {
      onSelectClause(c);
      setLoadingState(false);
      return;
    }
    try {
      const res = await fetch("https://scorgal.onrender.com/analyze_clause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clause_id: c.id,
          text: c.original,
          model: "gemini"
        })
      });
      const data = await res.json();
      setClauses((prev) => {
        const updated = prev.map((item, i) =>
          i === idx ? { ...item, ...data } : item
        );
        localStorage.setItem(
          "scorgal_doc",
          JSON.stringify({
            doc_type: docType,
            clauses: updated,
            summary: data.summary || ""
          })
        );
        return updated;
      });
      setProgress((prev) => prev + 1);
      onSelectClause(data);
    } catch (err) {
      console.error("[ERROR] Analyze failed:", err);
    } finally {
      setLoadingState(false);
    }
  };

  const handleClick = async (c, idx) => {
    setActiveIdx(idx);
    setLoadingState(true);
    onSelectClause(null);
    await analyzeClause(c, idx);
  };

  // 🔴 Unified Reset — clears doc, summary, chat, and backend memory
  const handleReset = async () => {
    try {
      // 1. Clear frontend state
      setClauses([]);
      setDocType("Unknown");
      setActiveIdx(null);
      setProgress(0);
      setDocSummary("");
      onSelectClause(null);

      // 2. Clear local storage
      localStorage.removeItem("scorgal_doc");
      localStorage.removeItem("scorgal_lang");

      // 3. Clear chats (parent state)
      if (clearClauseChat) clearClauseChat();
      if (clearGlobalChat) clearGlobalChat();

      // 4. Clear backend cache + chat memory
      await fetch("https://scorgal.onrender.com/clear_cache", { method: "POST" });
      await fetch("https://scorgal.onrender.com/reset_chat", { method: "POST" });

      alert("✅ Everything reset! Fresh start.");
    } catch (err) {
      console.error("[ERROR] Reset failed:", err);
      alert("⚠️ Failed to reset everything");
    }
  };

  const handleClearCache = async () => {
    try {
      await fetch("https://scorgal.onrender.com/clear_cache", { method: "POST" });
      localStorage.removeItem("scorgal_doc");
      setClauses([]);
      setDocType("Unknown");
      setActiveIdx(null);
      setProgress(0);
      onSelectClause(null);
      setDocSummary("");
      if (clearClauseChat) clearClauseChat();
      if (clearGlobalChat) clearGlobalChat();
      alert("✅ Cache cleared successfully!");
    } catch (err) {
      console.error("[ERROR] Clear cache failed:", err);
      alert("⚠️ Failed to clear cache");
    }
  };

  return (
    <div className="space-y-4">
      <UploadBox
        onUpload={handleUpload}
        onReset={handleReset}   // 🔴 Reset now fully wipes everything
        onStart={() => setUploading(true)}
      />

      {/* Uploading loader */}
      {uploading && (
        <div className="flex items-center gap-2 mt-2 text-purple-600 text-sm animate-pulse">
          <svg
            className="w-5 h-5 animate-spin text-purple-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l3 3-3 3v-4a8 8 0 01-8-8z"
            ></path>
          </svg>
          <span>Uploading & parsing document…</span>
        </div>
      )}

      <p className="text-xs text-gray-500">Detected type: {docType}</p>

      {/* Language selector */}
      <select
        value={lang}
        onChange={(e) => {
          setLang(e.target.value);
          localStorage.setItem("scorgal_lang", e.target.value);
        }}
        className="p-2 border rounded w-full"
      >
        <option value="en">English 🇬🇧</option>
        <option value="hi">Hindi 🇮🇳</option>
        <option value="mr">Marathi 🌸</option>
      </select>

      {clauses.length > 0 && (
        <>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-purple-600 h-3 rounded-full transition-all"
              style={{ width: `${(progress / clauses.length) * 100}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500">
            {progress} / {clauses.length} clauses analyzed
          </p>

          {/* Purple Clear Cache */}
          <button
            onClick={handleClearCache}
            className="p-2 w-full bg-purple-500 text-white rounded hover:bg-purple-600 mt-2"
          >
            🗑️ Clear Cache
          </button>
        </>
      )}

      {clauses.length === 0 ? (
        <p className="text-gray-400 italic text-sm">
          No clauses yet. Upload or paste something.
        </p>
      ) : (
        clauses.map((c, idx) => (
          <div
            key={c.id}
            className={`p-2 rounded cursor-pointer ${
              activeIdx === idx
                ? "bg-purple-600 text-white"
                : "bg-white hover:bg-purple-50"
            }`}
            onClick={() => handleClick(c, idx)}
          >
            {c.label || "📜 Untitled Clause"}
          </div>
        ))
      )}
    </div>
  );
}
