/**
 * Specialized prompt templates for different legal tasks.
 */

export const legalQAPrompt = (question: string, jurisdiction: string = "Indian") => `
Answer the following legal question regarding ${jurisdiction} law:
Question: ${question}

Format your response:
1. Start with "Yes" or "No" if applicable
2. Cite the specific law/statute/section
3. Keep explanation under 4 lines
4. Do NOT include disclaimers unless asked
`;

export const documentAnalysisPrompt = (documentText: string) => `
Analyze this legal document and identify:
1. Key clauses and their implications
2. Potential risks or ambiguous language
3. Missing standard provisions
4. Recommendations for improvement

Document: ${documentText}
`;

export const contractDraftingPrompt = (type: string, terms: string) => `
Draft a professional ${type} based on the following terms:
${terms}

Follow Indian legal standards and include standard boilerplate clauses like:
- Parties and Effective Date
- Definitions
- Scope of Services/Obligations
- Consideration/Payment Terms
- Term and Termination
- Confidentiality
- Dispute Resolution (Arbitration)
- Governing Law (Indian Law)
`;

export const petitionGenerationPrompt = (caseType: string, parties: string, facts: string) => `
Generate a formal ${caseType} for an Indian Court.
Parties: ${parties}
Key Facts: ${facts}

Structure the petition with:
1. Court Name and Jurisdiction
2. Case Title (Petitioner vs Respondent)
3. Brief Facts of the Case
4. Legal Grounds (Cite relevant IPC/CrPC/Civil sections)
5. Prayer for Relief
6. Verification
`;

export const ragAugmentedPrompt = (query: string, context: string) => `
You are a legal expert. Use the following retrieved context from legal documents to answer the user's query.
If the answer is not in the context, say you don't know based on the provided documents, but offer general legal knowledge if applicable.

Context:
${context}

User Query:
${query}

Answer in a professional, authoritative tone.
`;
