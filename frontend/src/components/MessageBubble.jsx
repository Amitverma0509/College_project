export default function MessageBubble({ role, content, sources }) {
  return (
    <div className={`message-bubble ${role}`}>
      <div className="message-content">{content}</div>

      {sources && sources.length > 0 && (
        <div className="message-sources">
          <span className="sources-label">Sources</span>
          <ul>
            {sources.map((s, i) => (
              <li key={i}>
                <strong>{s.filename}</strong> · chunk {s.chunkIndex} · score {s.score}
                <div className="source-excerpt">{s.excerpt}…</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
