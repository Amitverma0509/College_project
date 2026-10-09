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

app.set("trust proxy", 1);

const allowedOrigins = config.corsOrigin.split(",").map((o) => o.trim().replace(/\/$/, ""));
app.use(
  cors({
    origin: allowedOrigins.includes("*")
      ? true
      : (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)),
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ name: "RAG PDF Chat API", status: "running", health: "/api/health" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.use("/api/upload", uploadRouter);
app.use("/api/query", queryRouter);
app.use("/api/documents", documentsRouter);

app.use(errorHandler);

app.listen(config.port, "0.0.0.0", () => {
  console.log(`RAG backend listening on port ${config.port}`);
});
