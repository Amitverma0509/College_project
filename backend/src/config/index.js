import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..", "..");

export const config = {
  port: process.env.PORT || 5000,

  groqApiKey: process.env.GROQ_API_KEY || "",
  groqModel: process.env.GROQ_MODEL || "llama-3.1-8b-instant",

  embeddingModel: process.env.EMBEDDING_MODEL || "Xenova/all-MiniLM-L6-v2",

  chunkSize: parseInt(process.env.CHUNK_SIZE || "1000", 10),
  chunkOverlap: parseInt(process.env.CHUNK_OVERLAP || "200", 10),

  topK: parseInt(process.env.TOP_K || "5", 10),
  minScore: parseFloat(process.env.MIN_SCORE || "0.2"),

  uploadsDir: path.join(ROOT_DIR, "data", "uploads"),
  vectorStoreDir: path.join(ROOT_DIR, "data", "vector_store"),
  vectorStoreFile: path.join(ROOT_DIR, "data", "vector_store", "store.json"),
  documentsFile: path.join(ROOT_DIR, "data", "vector_store", "documents.json"),
};
