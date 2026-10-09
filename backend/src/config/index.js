import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..", "..");

// On Render, point DATA_DIR at the persistent disk mount path (e.g. /var/data).
// Locally it defaults to ./data inside the project.
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT_DIR, "data");

export const config = {
  port: process.env.PORT || 5000,

  // Comma-separated list of allowed frontend origins. "*" allows all.
  corsOrigin: process.env.CORS_ORIGIN || "*",

  dataDir: DATA_DIR,

  groqApiKey: process.env.GROQ_API_KEY || "",
  groqModel: process.env.GROQ_MODEL || "llama-3.1-8b-instant",

  embeddingModel: process.env.EMBEDDING_MODEL || "Xenova/all-MiniLM-L6-v2",

  chunkSize: parseInt(process.env.CHUNK_SIZE || "1000", 10),
  chunkOverlap: parseInt(process.env.CHUNK_OVERLAP || "200", 10),

  topK: parseInt(process.env.TOP_K || "5", 10),
  minScore: parseFloat(process.env.MIN_SCORE || "0.2"),

  uploadsDir: path.join(DATA_DIR, "uploads"),
  vectorStoreDir: path.join(DATA_DIR, "vector_store"),
  vectorStoreFile: path.join(DATA_DIR, "vector_store", "store.json"),
  documentsFile: path.join(DATA_DIR, "vector_store", "documents.json"),
};
