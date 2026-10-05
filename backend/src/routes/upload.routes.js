import { Router } from "express";
import { uploadPdfs } from "../middleware/upload.middleware.js";
import { ingestMultiplePdfs } from "../services/ragService.js";

export const uploadRouter = Router();

// POST /api/upload  (multipart/form-data, field name: "pdfs", supports multiple files)
uploadRouter.post("/", uploadPdfs.array("pdfs", 20), async (req, res, next) => {
  try {
    if (!req.files || !req.files.length) {
      return res.status(400).json({ error: "No PDF files were uploaded. Use field name 'pdfs'." });
    }

    const results = await ingestMultiplePdfs(req.files);

    res.status(201).json({
      message: `Processed ${results.length} file(s).`,
      documents: results,
    });
  } catch (err) {
    next(err);
  }
});
