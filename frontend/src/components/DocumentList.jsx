import { deleteDocument } from "../api/client.js";

const STATUS_LABEL = {
  processing: "Processing…",
  ready: "Ready",
  empty: "No extractable text",
  failed: "Failed",
};

export default function DocumentList({ documents, onChange }) {
  async function handleDelete(id) {
    await deleteDocument(id);
    onChange(documents.filter((d) => d.id !== id));
  }

  if (!documents.length) {
    return <p className="empty-state">No documents uploaded yet.</p>;
  }

  return (
    <ul className="document-list">
      {documents.map((doc) => (
        <li key={doc.id} className={`document-item status-${doc.status}`}>
          <div className="document-info">
            <span className="document-name">{doc.filename}</span>
            <span className="document-meta">
              {doc.numPages} page{doc.numPages === 1 ? "" : "s"} · {doc.numChunks} chunk
              {doc.numChunks === 1 ? "" : "s"} · {STATUS_LABEL[doc.status] || doc.status}
            </span>
          </div>
          <button className="icon-button" title="Remove" onClick={() => handleDelete(doc.id)}>
            ✕
          </button>
        </li>
      ))}
    </ul>
  );
}
