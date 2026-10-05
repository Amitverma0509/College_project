import { Router } from "express";
import { documentRegistry } from "../services/documentRegistry.js";
import { vectorStore } from "../services/vectorStore.js";

export const documentsRouter = Router();

// GET /api/documents
documentsRouter.get("/", async (req, res, next) => {
  try {
    const documents = await documentRegistry.list();
    res.json({ documents });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/documents/:id  - removes document metadata + its vector chunks
documentsRouter.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const removedChunks = await vectorStore.removeByDocumentId(id);
    const removedDocs = await documentRegistry.remove(id);

    if (!removedDocs) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.json({ message: "Document removed", removedChunks });
  } catch (err) {
    next(err);
  }
});
