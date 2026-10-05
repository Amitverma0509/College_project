import { v4 as uuidv4 } from "uuid";
import { extractTextFromPdf } from "./pdfService.js";
import { splitText } from "./textSplitter.js";
import { embeddingManager } from "./embeddingService.js";
import { vectorStore } from "./vectorStore.js";
import { documentRegistry } from "./documentRegistry.js";
import { generateAnswer } from "./llmService.js";
import { config } from "../config/index.js";

/**
 * DATA INGESTION PIPELINE
 * PDF file -> extract text -> chunk -> embed -> store in vector DB
 */
export async function ingestPdf({ filePath, originalName }) {
  const documentId = uuidv4();

  const doc = await documentRegistry.add({
    id: documentId,
    filename: originalName,
    status: "processing",
    numPages: 0,
    numChunks: 0,
    uploadedAt: new Date().toISOString(),
  });

  try {
    const { text, numPages } = await extractTextFromPdf(filePath);

    const chunks = splitText(text, {
      chunkSize: config.chunkSize,
      chunkOverlap: config.chunkOverlap,
    });

    if (!chunks.length) {
      await documentRegistry.update(documentId, { status: "empty", numPages });
      return { ...doc, status: "empty", numPages, numChunks: 0 };
    }

    const embeddings = await embeddingManager.embedBatch(chunks);

    const records = chunks.map((chunkText, i) => ({
      id: `${documentId}-${i}`,
      text: chunkText,
      embedding: embeddings[i],
      metadata: {
        documentId,
        filename: originalName,
        chunkIndex: i,
      },
    }));

    await vectorStore.addDocuments(records);

    const updated = await documentRegistry.update(documentId, {
      status: "ready",
      numPages,
      numChunks: chunks.length,
    });

    return updated;
  } catch (err) {
    await documentRegistry.update(documentId, { status: "failed", error: err.message });
    throw err;
  }
}

export async function ingestMultiplePdfs(files) {
  const results = [];
  for (const file of files) {
    // sequential to keep memory/CPU predictable for the local embedding model
    const result = await ingestPdf({ filePath: file.path, originalName: file.originalname });
    results.push(result);
  }
  return results;
}

/**
 * RETRIEVAL + AUGMENTATION + GENERATION PIPELINE
 * question -> embed -> similarity search -> build context -> LLM -> answer
 */
export async function askQuestion(question, { topK = config.topK, minScore = config.minScore, documentId = null } = {}) {
  if (!question || !question.trim()) {
    throw new Error("question is required");
  }

  const queryEmbedding = await embeddingManager.embedText(question);
  const matches = await vectorStore.similaritySearch(queryEmbedding, { topK, minScore, documentId });

  if (!matches.length) {
    return {
      answer: "I don't have enough information from the uploaded documents to answer that.",
      sources: [],
    };
  }

  const answer = await generateAnswer(question, matches);

  const sources = matches.map((m) => ({
    filename: m.metadata.filename,
    chunkIndex: m.metadata.chunkIndex,
    score: Number(m.score.toFixed(4)),
    excerpt: m.text.slice(0, 240),
  }));

  return { answer, sources };
}
