import fs from "fs/promises";
import fssync from "fs";
import { config } from "../config/index.js";

/**
 * Tracks metadata about every uploaded document (id, filename, page count,
 * chunk count, upload timestamp, status) independent of the vector chunks
 * themselves. Persisted as JSON, mirrors what a "documents" table would do.
 */
class DocumentRegistry {
  constructor(file = config.documentsFile) {
    this.file = file;
    this.documents = [];
    this._loaded = false;
  }

  async _ensureLoaded() {
    if (this._loaded) return;
    if (fssync.existsSync(this.file)) {
      const raw = await fs.readFile(this.file, "utf-8");
      this.documents = raw.trim() ? JSON.parse(raw) : [];
    } else {
      this.documents = [];
    }
    this._loaded = true;
  }

  async _persist() {
    await fs.mkdir(config.vectorStoreDir, { recursive: true });
    await fs.writeFile(this.file, JSON.stringify(this.documents, null, 2), "utf-8");
  }

  async add(doc) {
    await this._ensureLoaded();
    this.documents.push(doc);
    await this._persist();
    return doc;
  }

  async update(id, patch) {
    await this._ensureLoaded();
    const idx = this.documents.findIndex((d) => d.id === id);
    if (idx === -1) return null;
    this.documents[idx] = { ...this.documents[idx], ...patch };
    await this._persist();
    return this.documents[idx];
  }

  async list() {
    await this._ensureLoaded();
    return this.documents;
  }

  async remove(id) {
    await this._ensureLoaded();
    const before = this.documents.length;
    this.documents = this.documents.filter((d) => d.id !== id);
    await this._persist();
    return before - this.documents.length;
  }
}

export const documentRegistry = new DocumentRegistry();
