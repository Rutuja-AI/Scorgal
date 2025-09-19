import React, { useState, useEffect } from "react";

export default function ClauseView({ clause, lang = "en", isLoading }) {
  // 🔹 Multiple rotating loading messages
  const loadingMessages = [
    "⏳ Loading clause details…",
    "🔍 Scanning legal jargon…",
    "📖 Reading fine print carefully…",
    "🤔 Untangling complex words…",
    "✨ Almost ready to show results…"
  ];

  const [loadingMsg, setLoadingMsg] = useState(loadingMessages[0]);

  // Cycle messages while loading
  useEffect(() => {
    if (!isLoading) return;

    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % loadingMessages.length;
      setLoadingMsg(loadingMessages[i]);
    }, 1500); // switch every 1.5s

    return () => clearInterval(interval);
  }, [isLoading]);

  // 🔹 Show rotating loading messages if a clause is being analyzed
  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center h-full bg-white text-purple-600">
        <svg
          className="animate-spin h-6 w-6 mr-3 text-purple-600"
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
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          ></path>
        </svg>
        <span>{loadingMsg}</span>
      </div>
    );
  }

  // 🔹 If no clause selected
  if (!clause) {
    const messages = {
      en: "📜 Please select a clause to view details.",
      hi: "📜 कृपया विवरण देखने के लिए कोई क्लॉज़ चुनें।",
      mr: "📜 तपशील पाहण्यासाठी कृपया एक क्लॉज निवडा.",
    };
    return (
      <div className="p-4 text-gray-400 italic">
        {messages[lang] || messages.en}
      </div>
    );
  }

  const isPending =
    clause.explanation === "Explanation pending..." ||
    clause.risk === "Risk pending...";

  if (isPending) {
    return (
      <div className="p-4 flex items-center space-x-3 text-purple-600">
        <svg
          className="animate-spin h-5 w-5 text-purple-600"
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
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          ></path>
        </svg>
        <span>⏳ Analyzing this clause… please wait.</span>
      </div>
    );
  }

  const explanation =
    (clause.explanation && clause.explanation[lang]) ||
    clause.explanation?.en ||
    "⚠️ No explanation available";

  const riskText =
    (clause.risk && clause.risk[lang]) ||
    clause.risk?.en ||
    "⚠️ No risk analysis available";

  const risks = String(riskText)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return (
    <div className="p-4 border-b border-gray-200">
      <h3 className="font-semibold mb-1">
        {clause.id === "context" ? "Original Context" : "Original Clause"}
      </h3>
      <p className="mb-4 bg-gray-100 p-2 rounded">
        {clause.original || "⚠️ No original text available"}
      </p>

      <h3 className="font-semibold mb-1">Explanation</h3>
      <p className="mb-4 bg-blue-50 p-2 rounded">{explanation}</p>

      <h3 className="font-semibold mb-1">Risk</h3>
      <div
        className={`p-2 rounded ${
          risks.length === 1 && risks[0].includes("No significant risks")
            ? "bg-gray-100 text-gray-600"
            : "bg-red-50 text-red-700"
        }`}
      >
        {risks.length > 1 ? (
          <ul className="list-disc pl-5 space-y-1">
            {risks.map((r, idx) => (
              <li key={idx}>{r.replace(/^- /, "")}</li>
            ))}
          </ul>
        ) : (
          <p>{risks[0]}</p>
        )}
      </div>

      {/* 🔮 Model badge */}
      {clause.model_used && (
        <p className="text-xs text-gray-500 italic mt-2">
          🔮 Powered by {clause.model_used}
        </p>
      )}
    </div>
  );
}
 