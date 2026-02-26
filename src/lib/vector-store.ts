import { GoogleGenAI } from "@google/genai";

interface VectorEntry {
  id: string;
  text: string;
  embedding: number[];
  metadata?: any;
}

// Simple in-memory vector store
let vectorStore: VectorEntry[] = [];

export const getEmbeddings = async (text: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  const result = await ai.models.embedContent({
    model: "text-embedding-004",
    contents: [{ parts: [{ text }] }]
  });
  return result.embeddings[0].values;
};

export const addToVectorStore = async (chunks: string[], metadata: any = {}) => {
  const newEntries: VectorEntry[] = [];
  
  for (const chunk of chunks) {
    const embedding = await getEmbeddings(chunk);
    newEntries.push({
      id: Math.random().toString(36).substring(7),
      text: chunk,
      embedding,
      metadata
    });
  }
  
  vectorStore = [...vectorStore, ...newEntries];
  return newEntries;
};

const cosineSimilarity = (vecA: number[], vecB: number[]) => {
  const dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
  const magB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
  return dotProduct / (magA * magB);
};

export const queryVectorStore = async (query: string, topK: number = 3) => {
  const queryEmbedding = await getEmbeddings(query);
  
  const results = vectorStore
    .map(entry => ({
      ...entry,
      similarity: cosineSimilarity(queryEmbedding, entry.embedding)
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
    
  return results;
};

export const clearVectorStore = () => {
  vectorStore = [];
};
