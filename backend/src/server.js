import express from "express";
import cors from "cors";
import fs from "fs";
import { config } from "./config/index.js";
import { uploadRouter } from "./routes/upload.routes.js";
import { queryRouter } from "./routes/query.routes.js";
import { documentsRouter } from "./routes/documents.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

// Ensure runtime data directories exist
fs.mkdirSync(config.uploadsDir, { recursive: true });
fs.mkdirSync(config.vectorStoreDir, { recursive: true });

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.use("/api/upload", uploadRouter);
app.use("/api/query", queryRouter);
app.use("/api/documents", documentsRouter);

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`RAG backend listening on http://localhost:${config.port}`);
});
