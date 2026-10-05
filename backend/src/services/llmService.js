import Groq from "groq-sdk";
import { config } from "../config/index.js";

let client = null;
function getClient() {
  if (!config.groqApiKey) {
    throw new Error("GROQ_API_KEY is not set. Add it to backend/.env");
  }
  if (!client) client = new Groq({ apiKey: config.groqApiKey });
  return client;
}

const SYSTEM_PROMPT = `You are a helpful assistant that answers questions using ONLY the provided context, extracted from documents the user uploaded.
- If the answer is not contained in the context, say you don't have enough information from the uploaded documents.
- Be concise and accurate.
- Do not make up information that is not in the context.`;

/**
 * Ask the LLM a question, grounded in the given context chunks.
 * @param {string} question
 * @param {{ text: string, metadata: object }[]} contextChunks
 * @returns {Promise<string>}
 */
export async function generateAnswer(question, contextChunks) {
  const groq = getClient();

  const context = contextChunks
    .map((c, i) => `[Source ${i + 1} - ${c.metadata.filename}, chunk ${c.metadata.chunkIndex}]\n${c.text}`)
    .join("\n\n---\n\n");

  const userPrompt = `Context:\n${context || "(no relevant context found)"}\n\nQuestion: ${question}\n\nAnswer based only on the context above.`;

  const completion = await groq.chat.completions.create({
    model: config.groqModel,
    temperature: 0.1,
    max_tokens: 1024,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });

  return completion.choices[0]?.message?.content?.trim() || "";
}
