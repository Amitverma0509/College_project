import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config/index.js";

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error(`Only PDF files are allowed. Got: ${file.mimetype}`));
  }
}

export const uploadPdfs = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024, files: 20 }, // 25MB per file, up to 20 files
});
