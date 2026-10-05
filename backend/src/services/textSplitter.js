/**
 * A lightweight re-implementation of LangChain's RecursiveCharacterTextSplitter.
 * Splits text on a prioritized list of separators, recursively, so that
 * chunks stay under `chunkSize` characters while preserving `chunkOverlap`
 * characters of context between consecutive chunks.
 */
const DEFAULT_SEPARATORS = ["\n\n", "\n", ". ", " ", ""];

function splitOnSeparator(text, separator) {
  if (separator === "") return text.split("");
  return text.split(separator);
}

function mergeSplits(splits, separator, chunkSize, chunkOverlap) {
  const chunks = [];
  let currentChunk = [];
  let currentLen = 0;

  for (const split of splits) {
    const splitLen = split.length;

    if (currentLen + splitLen + (currentChunk.length ? separator.length : 0) > chunkSize && currentChunk.length) {
      const joined = currentChunk.join(separator);
      if (joined.trim()) chunks.push(joined);

      // Build overlap: keep trailing pieces of the current chunk whose
      // combined length is <= chunkOverlap
      while (
        currentLen > chunkOverlap ||
        (currentLen + splitLen + separator.length > chunkSize && currentLen > 0)
      ) {
        currentLen -= currentChunk[0].length + (currentChunk.length > 1 ? separator.length : 0);
        currentChunk.shift();
      }
    }

    currentChunk.push(split);
    currentLen += splitLen + (currentChunk.length > 1 ? separator.length : 0);
  }

  if (currentChunk.length) {
    const joined = currentChunk.join(separator);
    if (joined.trim()) chunks.push(joined);
  }

  return chunks;
}

function recursiveSplit(text, separators, chunkSize, chunkOverlap) {
  const finalChunks = [];
  let separator = separators[separators.length - 1];
  let remainingSeparators = [];

  for (let i = 0; i < separators.length; i++) {
    if (separators[i] === "" || text.includes(separators[i])) {
      separator = separators[i];
      remainingSeparators = separators.slice(i + 1);
      break;
    }
  }

  const splits = splitOnSeparator(text, separator).filter((s) => s !== "");
  const goodSplits = [];

  for (const s of splits) {
    if (s.length < chunkSize) {
      goodSplits.push(s);
    } else {
      if (goodSplits.length) {
        finalChunks.push(...mergeSplits(goodSplits, separator, chunkSize, chunkOverlap));
        goodSplits.length = 0;
      }
      if (!remainingSeparators.length) {
        finalChunks.push(s);
      } else {
        finalChunks.push(...recursiveSplit(s, remainingSeparators, chunkSize, chunkOverlap));
      }
    }
  }

  if (goodSplits.length) {
    finalChunks.push(...mergeSplits(goodSplits, separator, chunkSize, chunkOverlap));
  }

  return finalChunks;
}

/**
 * Split a block of text into overlapping chunks.
 * @param {string} text
 * @param {{ chunkSize?: number, chunkOverlap?: number, separators?: string[] }} options
 * @returns {string[]}
 */
export function splitText(text, { chunkSize = 1000, chunkOverlap = 200, separators = DEFAULT_SEPARATORS } = {}) {
  const cleaned = text.replace(/\r\n/g, "\n").trim();
  if (!cleaned) return [];
  return recursiveSplit(cleaned, separators, chunkSize, chunkOverlap).map((c) => c.trim()).filter(Boolean);
}
