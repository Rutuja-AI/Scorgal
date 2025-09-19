import { useState } from "react";

export default function GlobalChatbot({ messages, setMessages }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { role: "user", text: input }]);
    const userInput = input;
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("https://scorgal.onrender.com/chat_doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userInput }),
      });

      if (!res.ok) throw new Error("Server error");
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.reply || "⚠️ No reply" },
      ]);
    } catch (err) {
      console.error("[GlobalChatbot] Error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "⚠️ Failed to fetch answer." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-2 p-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-2 rounded max-w-xs ${
              m.role === "user" ? "bg-purple-200 ml-auto" : "bg-gray-200"
            }`}
          >
            {m.text}
          </div>
        ))}
        {loading && (
          <div className="p-2 rounded max-w-xs bg-gray-200 italic">
            Thinking…
          </div>
        )}
      </div>

      {/* Input bar fixed at bottom */}
      <div className="flex border-t p-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              sendMessage(); // Enter triggers send
            }
          }}
          className="flex-1 border rounded-l px-3 py-2 focus:outline-none"
          placeholder="Ask about the document..."
        />
        <button
          onClick={sendMessage}
          className="bg-purple-600 text-white px-4 rounded-r hover:bg-purple-700 disabled:opacity-50"
          disabled={loading}
        >
          Send
        </button>
      </div>
    </div>
  );
}
