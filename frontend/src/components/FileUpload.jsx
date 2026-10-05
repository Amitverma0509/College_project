import { useRef, useState } from "react";
import { uploadPdfs } from "../api/client.js";

export default function FileUpload({ onUploaded }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedNames, setSelectedNames] = useState([]);

  async function handleFiles(fileList) {
    const files = Array.from(fileList).filter((f) => f.type === "application/pdf");
    if (!files.length) {
      setError("Please select PDF files only.");
      return;
    }

    setSelectedNames(files.map((f) => f.name));
    setError(null);
    setUploading(true);
    try {
      const result = await uploadPdfs(files);
      onUploaded(result.documents);
      setSelectedNames([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div
      className={`upload-dropzone ${isDragging ? "dragging" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />

      {uploading ? (
        <p>Processing {selectedNames.length} file(s) — chunking &amp; embedding…</p>
      ) : (
        <>
          <p className="upload-title">Drag &amp; drop PDFs here, or click to browse</p>
          <p className="upload-hint">You can select multiple files at once</p>
        </>
      )}

      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
