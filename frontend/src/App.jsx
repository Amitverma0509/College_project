import { useEffect, useState } from "react";
import FileUpload from "./components/FileUpload.jsx";
import DocumentList from "./components/DocumentList.jsx";
import ChatWindow from "./components/ChatWindow.jsx";
import { fetchDocuments } from "./api/client.js";

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  useEffect(() => {
    fetchDocuments()
      .then((data) => setDocuments(data.documents))
      .catch(() => {})
      .finally(() => setLoadingDocs(false));
  }, []);

  function handleUploaded(newDocs) {
    setDocuments((prev) => [...prev, ...newDocs]);
  }

  const readyCount = documents.filter((d) => d.status === "ready").length;

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>RAG PDF Chat</h1>
        <p>Upload PDFs, then ask questions grounded in their content.</p>
      </header>

      <main className="app-main">
        <section className="sidebar">
          <FileUpload onUploaded={handleUploaded} />
          <h2 className="section-title">Documents</h2>
          {loadingDocs ? (
            <p className="empty-state">Loading…</p>
          ) : (
            <DocumentList documents={documents} onChange={setDocuments} />
          )}
        </section>

        <section className="chat-section">
          <ChatWindow disabled={readyCount === 0} />
        </section>
      </main>
    </div>
  );
}
