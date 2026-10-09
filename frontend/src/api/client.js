// In production (Render) set VITE_API_URL to the backend URL, e.g.
// https://rag-backend.onrender.com  (no trailing slash).
// Locally it is empty, so requests go to "/api" and Vite proxies them.
const API_ORIGIN = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const BASE_URL = `${API_ORIGIN}/api`;

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

/**
 * Upload one or more PDF files for ingestion.
 * @param {File[]} files
 */
export async function uploadPdfs(files) {
  const formData = new FormData();
  files.forEach((file) => formData.append("pdfs", file));

  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });
  return handleResponse(res);
}

/** Fetch all ingested documents. */
export async function fetchDocuments() {
  const res = await fetch(`${BASE_URL}/documents`);
  return handleResponse(res);
}

/** Delete a document and its vector chunks. */
export async function deleteDocument(id) {
  const res = await fetch(`${BASE_URL}/documents/${id}`, { method: "DELETE" });
  return handleResponse(res);
}

/**
 * Ask a question against the ingested documents.
 * @param {string} question
 * @param {{ documentId?: string }} options
 */
export async function askQuestion(question, options = {}) {
  const res = await fetch(`${BASE_URL}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, ...options }),
  });
  return handleResponse(res);
}
