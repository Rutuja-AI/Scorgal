import React from "react";

export default function UploadBox({ onUpload, onReset, onStart }) {
  // --- Handle file upload ---
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (onStart) onStart();   // 🔹 Trigger loader in Sidebar

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("https://scorgal.onrender.com/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      onUpload(data);
    } catch (err) {
      console.error("[ERROR] Upload failed:", err);
      alert("⚠️ Upload failed");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Upload */}
      <label className="border-2 border-dashed border-purple-400 p-6 rounded cursor-pointer text-center hover:bg-purple-50">
        <input type="file" hidden onChange={handleFileUpload} />
        📂 Click to upload a document or image
      </label>

      {/* Reset */}
      <button
        onClick={onReset}
        className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
      >
        ✖ Reset
      </button>
    </div>
  );
}
