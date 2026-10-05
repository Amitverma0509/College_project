import fs from "fs/promises";
import fssync from "fs";
import { config } from "../config/index.js";

/**
 * A minimal, dependency-free vector store persisted to a JSON file on disk.
 * Equivalent role to the ChromaDB-backed VectorStore class in the original
 * Python project, just without needing an external Chroma server.
 *
 * Each record: { id, text, embedding: number[], metadata: {...} }
 */
class VectorStore {
  constructor(storeFile = config.vectorStoreFile) {
    this.storeFile = storeFile;
    this.records = [];
    this._loaded = false;
  }

  async _ensureLoaded() {
    if (this._loaded) return;
    if (fssync.existsSync(this.storeFile)) {
      const raw = await fs.readFile(this.storeFile, "utf-8");
      this.records = raw.trim() ? JSON.parse(raw) : [];
    } else {
      this.records = [];
    }
    this._loaded = true;
  }

  async _persist() {
    await fs.mkdir(config.vectorStoreDir, { recursive: true });
    await fs.writeFile(this.storeFile, JSON.stringify(this.records), "utf-8");
  }

  /**
   * Add chunk records with their embeddings.
   * @param {{ id: string, text: string, embedding: number[], metadata: object }[]} items
   */
  async addDocuments(items) {
    await this._ensureLoaded();
    this.records.push(...items);
    await this._persist();
    return items.length;
  }

  static cosineSimilarity(a, b) {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Retrieve the top-k most similar chunks to a query embedding.
   * @param {number[]} queryEmbedding
   * @param {{ topK?: number, minScore?: number, documentId?: string }} options
   */
  async similaritySearch(queryEmbedding, { topK = 5, minScore = 0, documentId = null } = {}) {
    await this._ensureLoaded();
    const pool = documentId ? this.records.filter((r) => r.metadata.documentId === documentId) : this.records;

    const scored = pool.map((r) => ({
      ...r,
      score: VectorStore.cosineSimilarity(queryEmbedding, r.embedding),
    }));

    return scored
      .filter((r) => r.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(({ embedding, ...rest }) => rest); // don't ship the raw vector back to the client
  }

  async removeByDocumentId(documentId) {
    await this._ensureLoaded();
    const before = this.records.length;
    this.records = this.records.filter((r) => r.metadata.documentId !== documentId);
    await this._persist();
    return before - this.records.length;
  }

  async count() {
    await this._ensureLoaded();
    return this.records.length;
  }

  async clear() {
    this.records = [];
    await this._persist();
  }
}

export const vectorStore = new VectorStore();
