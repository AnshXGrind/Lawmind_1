import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { legalQAPrompt, documentAnalysisPrompt, ragAugmentedPrompt } from "../lib/prompts";
import { queryVectorStore } from "../lib/vector-store";

const SYSTEM_INSTRUCTION = `You are LawMind, an expert AI legal drafting assistant for Indian lawyers. 
Your goal is to generate professionally formatted legal documents following Indian court standards (District Courts, High Courts, and Supreme Court of India).

Key Guidelines:
1. Use formal legal language (e.g., "The Petitioner humbly submits", "In the matter of").
2. Automatically suggest relevant sections of the Indian Penal Code (IPC), Code of Criminal Procedure (CrPC), Indian Evidence Act, or relevant Civil Laws.
3. Follow standard Indian legal formatting:
   - Court Name at the top.
   - Case Number placeholder.
   - Parties involved (Petitioner vs Respondent).
   - Subject/Heading.
   - Numbered paragraphs for facts and grounds.
   - Prayer section at the end.
4. If the user provides raw facts or a scanned document text, synthesize it into a coherent legal narrative.
5. Be precise, concise, and professional.

Output should be in Markdown format.`;

export async function generateLegalDraft(prompt: string, type: string, onChunk?: (chunk: string) => void) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  
  if (onChunk) {
    const response = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: `Draft a ${type} based on the following information: ${prompt}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    let fullText = "";
    for await (const chunk of response) {
      const text = (chunk as GenerateContentResponse).text || "";
      fullText += text;
      onChunk(text);
    }
    return fullText;
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Draft a ${type} based on the following information: ${prompt}`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
    },
  });

  return response.text;
}

export async function askLegalQuestion(question: string, jurisdiction: string = "Indian", onChunk?: (chunk: string) => void) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  
  // RAG: Query vector store for context
  const contextResults = await queryVectorStore(question);
  const contextText = contextResults.map(r => r.text).join('\n\n');
  
  const prompt = contextText 
    ? ragAugmentedPrompt(question, contextText)
    : legalQAPrompt(question, jurisdiction);

  if (onChunk) {
    const response = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are a legal expert assistant.",
        temperature: 0.3,
      },
    });

    let fullText = "";
    for await (const chunk of response) {
      const text = (chunk as GenerateContentResponse).text || "";
      fullText += text;
      onChunk(text);
    }
    return fullText;
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: "You are a legal expert assistant.",
      temperature: 0.3,
    },
  });

  return response.text;
}

export async function analyzeDocument(documentText: string, onChunk?: (chunk: string) => void) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  const prompt = documentAnalysisPrompt(documentText);

  if (onChunk) {
    const response = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are a senior legal analyst.",
        temperature: 0.2,
      },
    });

    let fullText = "";
    for await (const chunk of response) {
      const text = (chunk as GenerateContentResponse).text || "";
      fullText += text;
      onChunk(text);
    }
    return fullText;
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: "You are a senior legal analyst.",
      temperature: 0.2,
    },
  });

  return response.text;
}

export async function suggestLegalSections(content: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze this legal text and suggest relevant IPC, CrPC, or other Indian legal sections that apply. Provide a brief explanation for each: \n\n${content}`,
    config: {
      systemInstruction: "You are a legal research assistant specialized in Indian Law.",
    },
  });

  return response.text;
}

export async function researchLegalClauses(query: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Research and provide standard legal clauses or precedents for the following topic in the context of Indian Law: \n\n${query}. 
    Include:
    1. Standard Clause Text.
    2. Variations (e.g., pro-petitioner vs pro-respondent).
    3. Relevant case law citations if applicable.`,
    config: {
      systemInstruction: "You are a legal research expert specialized in drafting and precedents.",
    },
  });

  return response.text;
}
