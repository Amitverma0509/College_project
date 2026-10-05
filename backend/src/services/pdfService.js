import fs from "fs/promises";
import pdfParse from "pdf-parse/lib/pdf-parse.js";

/**
 * Extract raw text (and basic metadata) from a PDF file on disk.
 * @param {string} filePath - absolute path to the PDF file
 * @returns {Promise<{ text: string, numPages: number, info: object }>}
 */
export async function extractTextFromPdf(filePath) {
  const buffer = await fs.readFile(filePath);
  const data = await pdfParse(buffer);

  return {
    text: data.text || "",
    numPages: data.numpages || 0,
    info: data.info || {},
  };
}
