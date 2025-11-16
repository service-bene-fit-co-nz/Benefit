import { DynamicTool } from "@langchain/core/tools";
import { ToolType } from "../toolManager/toolManager";
import { LLMType } from "../../types";

export type { LLMType };

export interface AIContent {
  id: string;
  content: string;
  type: "user" | "ai" | "error";
}

export type AITool = {
  name: string;
  prompt: string;
  tool: DynamicTool<string>;
};

export type AIConversation = {
  model: LLMType;
  prompt: string;
  toolList: ToolType[];
  conversation: AIContent[];
};

export type AIRequest = {
  prompt: string;
  tools: AITool[];
  conversation: AIContent[];
};

export class AIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIError";
    Object.setPrototypeOf(this, AIError.prototype);
  }
}
