# RAG PDF Chat — Node.js + React

A full-stack Retrieval Augmented Generation (RAG) application. Users upload one or
more PDFs from the UI; the backend parses, chunks, embeds and indexes them, and
answers questions grounded in the uploaded content using an LLM (Groq).

100% JavaScript — Node.js/Express backend, React (Vite) frontend. No Python.

## Architecture

```
┌─────────────┐        multipart/form-data        ┌──────────────────────┐
│   React UI   │ ───────────────────────────────▶ │   Express Backend    │
│ (Vite, :5173)│ ◀─────────────────────────────── │   Node.js, :5000      │
└─────────────┘        JSON (answers, docs)        └──────────┬───────────┘
                                                                │
                                    ┌───────────────────────────┼───────────────────────────┐
                                    ▼                            ▼                            ▼
                          PDF parsing (pdf-parse)     Local embeddings (@xenova/    Groq LLM (groq-sdk)
                          + chunking (custom          transformers, MiniLM,        for answer generation
                          RecursiveCharacterText      runs on-device, no API key)
                          Splitter)                            │
                                                                ▼
                                                     JSON vector store (cosine
                                                     similarity, data/vector_store/)
```

### Pipelines

**Data ingestion pipeline** (on upload):
`PDF file → extract text → chunk (recursive character splitter) → embed (local MiniLM model) → store in vector store`

**Retrieval pipeline** (on question):
`question → embed → cosine-similarity search top-k chunks → build context → prompt Groq LLM → answer + cited sources`

## Project structure

```
rag-app/
├── backend/
│   ├── src/
│   │   ├── server.js               # Express app entry point
│   │   ├── config/index.js         # env-driven config
│   │   ├── routes/                 # /api/upload, /api/query, /api/documents
│   │   ├── middleware/             # multer upload config, error handler
│   │   └── services/
│   │       ├── pdfService.js       # PDF text extraction
│   │       ├── textSplitter.js     # recursive character chunking
│   │       ├── embeddingService.js # local MiniLM embeddings
│   │       ├── vectorStore.js      # JSON-backed cosine similarity store
│   │       ├── documentRegistry.js # tracks uploaded document metadata
│   │       ├── llmService.js       # Groq chat completion
│   │       └── ragService.js       # orchestrates both pipelines
│   ├── data/uploads/               # uploaded PDFs (gitignored)
│   ├── data/vector_store/          # persisted embeddings + doc registry (gitignored)
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── components/
    │   │   ├── FileUpload.jsx      # multi-file drag & drop / picker
    │   │   ├── DocumentList.jsx    # uploaded docs, status, delete
    │   │   ├── ChatWindow.jsx      # question/answer chat UI
    │   │   └── MessageBubble.jsx   # message + source citations
    │   ├── api/client.js           # fetch wrapper for backend API
    │   └── index.css
    ├── vite.config.js              # dev proxy: /api → localhost:5000
    └── package.json
```

## Setup

### Prerequisites
- Node.js 18+
- A free Groq API key: https://console.groq.com/keys

### 1. Backend

```bash
cd backend
npm install
npm start
# cp .env.example .env
# edit .env and set GROQ_API_KEY=your_key
```



Runs on `http://localhost:5000`. On the **first** PDF upload, the local embedding
model (`Xenova/all-MiniLM-L6-v2`, ~90MB) is downloaded automatically and cached —
this needs internet access once; after that, embeddings run fully offline.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173` and proxies `/api/*` to the backend.

Open `http://localhost:5173`, upload PDFs, then ask questions.

## API reference

### `POST /api/upload`
`multipart/form-data`, field name `pdfs` (repeatable — supports multiple files, up to 20, 25MB each).

Response:
```json
{
  "message": "Processed 2 file(s).",
  "documents": [
    { "id": "uuid", "filename": "attention.pdf", "status": "ready", "numPages": 15, "numChunks": 42, "uploadedAt": "..." }
  ]
}
```

### `GET /api/documents`
Lists all ingested documents with status (`processing` | `ready` | `empty` | `failed`).

### `DELETE /api/documents/:id`
Removes a document's metadata and its vector chunks.

### `POST /api/query`
```json
{ "question": "What is scaled dot-product attention?", "documentId": "optional-to-scope-to-one-doc", "topK": 5 }
```
Response:
```json
{
  "answer": "...",
  "sources": [
    { "filename": "attention.pdf", "chunkIndex": 3, "score": 0.81, "excerpt": "..." }
  ]
}
```

## Configuration (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `GROQ_API_KEY` | — | required, from console.groq.com |
| `GROQ_MODEL` | `llama-3.1-8b-instant` | Groq chat model used for generation |
| `PORT` | `5000` | backend port |
| `EMBEDDING_MODEL` | `Xenova/all-MiniLM-L6-v2` | local embedding model |
| `CHUNK_SIZE` | `1000` | max characters per chunk |
| `CHUNK_OVERLAP` | `200` | overlap characters between chunks |
| `TOP_K` | `5` | chunks retrieved per query |
| `MIN_SCORE` | `0.2` | minimum cosine similarity to include a chunk |

## Design notes / trade-offs

- **Embeddings run locally** via `@xenova/transformers` (ONNX port of the same
  `all-MiniLM-L6-v2` model used by Python's `sentence-transformers`) — no per-call
  API cost, but the model download needs internet once, and embedding is CPU-bound
  (fine for course/demo scale; for production-scale throughput, swap in a hosted
  embeddings API or GPU inference).
- **Vector store** is a small dependency-free JSON file with in-memory cosine
  similarity search — simple and portable, good up to tens of thousands of chunks.
  Swap in Chroma/Pinecone/Qdrant/pgvector for larger corpora or concurrent writers.
- **LLM generation** uses Groq for fast, cheap inference; swap `llmService.js` to
  call OpenAI/Anthropic/local Ollama instead if preferred — it's an isolated module.

## Extending

- Add auth so documents are scoped per user.
- Stream LLM tokens to the frontend (SSE) instead of waiting for the full answer.
- Support `.docx`, `.txt`, `.html` uploads (same pipeline, different loader in `pdfService.js`-style module).
- Swap the JSON vector store for a real vector DB for production/multi-instance deployments.
