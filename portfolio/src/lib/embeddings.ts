/**
 * Embedding service for RAG (Retrieval-Augmented Generation)
 * Uses Hugging Face Inference API for semantic embeddings
 * Falls back to TF-IDF if API is unavailable
 */

export type EmbeddingVector = number[];

const HF_API_URL =
  "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2";
const HF_API_KEY = import.meta.env.VITE_HF_API_KEY || "";

/**
 * Get embeddings from Hugging Face API
 * Returns null if API fails or is unavailable
 */
export async function getEmbedding(
  text: string
): Promise<EmbeddingVector | null> {
  if (!HF_API_KEY) {
    return null; // No API key, skip embedding
  }

  try {
    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: text }),
    });

    if (!response.ok) {
      console.warn("HF Embedding API failed, falling back to TF-IDF");
      return null;
    }

    const data = await response.json();
    // Handle both single and batch responses
    const embedding = Array.isArray(data) ? data[0] : data;

    if (
      Array.isArray(embedding) &&
      embedding.length > 0 &&
      typeof embedding[0] === "number"
    ) {
      return embedding as EmbeddingVector;
    }

    return null;
  } catch (error) {
    console.warn("Embedding API error, falling back to TF-IDF:", error);
    return null;
  }
}

/**
 * Get embeddings for multiple texts (batch)
 */
export async function getEmbeddings(
  texts: string[]
): Promise<(EmbeddingVector | null)[]> {
  if (!HF_API_KEY || texts.length === 0) {
    return texts.map(() => null);
  }

  try {
    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: texts }),
    });

    if (!response.ok) {
      return texts.map(() => null);
    }

    const data = await response.json();

    // Handle batch response
    if (Array.isArray(data) && data.length === texts.length) {
      return data.map((emb: any) => {
        if (
          Array.isArray(emb) &&
          emb.length > 0 &&
          typeof emb[0] === "number"
        ) {
          return emb as EmbeddingVector;
        }
        return null;
      });
    }

    return texts.map(() => null);
  } catch (error) {
    console.warn("Batch embedding API error:", error);
    return texts.map(() => null);
  }
}

/**
 * Calculate cosine similarity between two embedding vectors
 */
export function cosineSimilarityEmbeddings(
  a: EmbeddingVector,
  b: EmbeddingVector
): number {
  if (a.length !== b.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) {
    return 0;
  }

  return dotProduct / denominator;
}

/**
 * Normalize embedding vector to unit length
 */
export function normalizeEmbedding(
  embedding: EmbeddingVector
): EmbeddingVector {
  const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (norm === 0) {
    return embedding;
  }
  return embedding.map((val) => val / norm);
}
