import { useState, useRef, useEffect } from "react";
import { askQuestion } from "../api/client.js";
import MessageBubble from "./MessageBubble.jsx";

export default function ChatWindow({ disabled }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSubmit(e) {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    setLoading(true);

    try {
      const result = await askQuestion(question);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.answer, sources: result.sources },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chat-window">
      <div className="chat-messages">
        {messages.length === 0 && (
          <p className="empty-state">
            {disabled
              ? "Upload a PDF to start asking questions."
              : "Ask a question about your uploaded documents."}
          </p>
        )}

        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role} content={m.content} sources={m.sources} />
        ))}

        {loading && <MessageBubble role="assistant" content="Thinking…" />}
        <div ref={bottomRef} />
      </div>

      <form className="chat-input-row" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder={disabled ? "Upload a PDF first…" : "Ask a question about your documents…"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={disabled || loading}
        />
        <button type="submit" disabled={disabled || loading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
