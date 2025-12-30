export type LLMType =
  | "Gemma-3-Lite"
  | "Gemma-3-Fast"
  | "Gemma-3-Balanced"
  | "Gemma-3-Power"
  | "Gemini-2.5-flash"
  | "Gemini-2.5-flash-lite"
  | "ChatGPT"
  | "Groq"
  | "Groq-versatile";

export type ToolIdentifier =
  | "clients.details.get"
  | "currentClient.details.get"
  | "currentClient.facebook.messages.get"
  | "allClients.details.get"
  | "allClients.notes.get"
  | "allClients.notes.save"
  | "allClients.rawFitbitData.get"
  | "allClients.allClients.get"
  | "allClients.idByName.get"
  | "db.sqlQuery.get"
  | "utility.currentDateTime.get";

import { Tool } from "ai";
import { toolMetadata } from "./vercel/toolManager/toolIndex";

export type ToolMetadata = {
  toolType: ToolIdentifier;
  description?: string;
  tool: Tool;
};

export { toolMetadata };
