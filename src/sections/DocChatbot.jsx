import { useState } from "react";

export default function DocChatbot({ messages, setMessages, onClose }) {
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
      console.error("[DocChatbot] Error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "⚠️ Failed to fetch answer." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const resetChat = async () => {
    try {
      await fetch("https://scorgal.onrender.com/reset_chat", { method: "POST" });
      setMessages([]); // clear parent state
      setInput("");
    } catch (err) {
      console.error("[DocChatbot] Reset error:", err);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with close button */}
      <div className="flex justify-between items-center border-b p-2 bg-purple-600 text-white">
        <h3 className="font-semibold">Document Assistant</h3>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-purple-500"
        >
          ✖
        </button>
      </div>

      {/* Chat history */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
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

      {/* Input + Send */}
      <div className="flex border-t">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              sendMessage();   // 👈 Enter triggers send
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

      {/* Reset button */}
      <div className="flex p-2">
        <button
          onClick={resetChat}
          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
