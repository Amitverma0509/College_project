import { pipeline } from "@xenova/transformers";
import { config } from "../config/index.js";

/**
 * Singleton wrapper around a local sentence-embedding model
 * (default: Xenova/all-MiniLM-L6-v2, the JS/ONNX port of the same
 * all-MiniLM-L6-v2 model used by `sentence-transformers` in the
 * original Python project). Runs fully locally, no API key needed.
 * The model weights are downloaded once and cached on first use.
 */
class EmbeddingManager {
  constructor(modelName = config.embeddingModel) {
    this.modelName = modelName;
    this.extractor = null;
    this.loadingPromise = null;
  }

  async _load() {
    if (this.extractor) return this.extractor;
    if (!this.loadingPromise) {
      console.log(`[embeddings] loading model "${this.modelName}" (first run downloads the weights)...`);
      this.loadingPromise = pipeline("feature-extraction", this.modelName).then((extractor) => {
        this.extractor = extractor;
        console.log("[embeddings] model ready");
        return extractor;
      });
    }
    return this.loadingPromise;
  }

  /**
   * Generate a single embedding vector (mean-pooled, normalized) for one string.
   * @param {string} text
   * @returns {Promise<number[]>}
   */
  async embedText(text) {
    const extractor = await this._load();
    const output = await extractor(text, { pooling: "mean", normalize: true });
    return Array.from(output.data);
  }

  /**
   * Generate embeddings for a batch of strings sequentially.
   * @param {string[]} texts
   * @returns {Promise<number[][]>}
   */
  async embedBatch(texts) {
    const extractor = await this._load();
    const vectors = [];
    for (const text of texts) {
      const output = await extractor(text, { pooling: "mean", normalize: true });
      vectors.push(Array.from(output.data));
    }
    return vectors;
  }
}

export const embeddingManager = new EmbeddingManager();
