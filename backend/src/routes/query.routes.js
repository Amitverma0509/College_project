import { Router } from "express";
import { askQuestion } from "../services/ragService.js";

export const queryRouter = Router();

// POST /api/query  { question: string, documentId?: string, topK?: number }
queryRouter.post("/", async (req, res, next) => {
  try {
    const { question, documentId, topK, minScore } = req.body;

    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "'question' (string) is required in the request body." });
    }

    const result = await askQuestion(question, { documentId, topK, minScore });
    res.json(result);
  } catch (err) {
    next(err);
  }
});
