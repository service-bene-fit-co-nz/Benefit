// src/utils/ai/agent/agentTypes.ts
export type LLMType = "Gemini" | "ChatGPT" | "Groq";

export interface AIConversation {
  toolList: string[];
  model: LLMType;
  prompt: string;
  conversation: {
    id: string | number;
    type: "user" | "ai" | "error";
    content: string;
  }[];
}

export interface AIContent {
  id: string | number;
  content: string;
  type: "ai" | "error";
}

export class AIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIError";
  }
}