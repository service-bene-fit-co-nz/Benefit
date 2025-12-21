import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { groq } from "@ai-sdk/groq";
import {
  convertToModelMessages,
  streamText,
  type UIMessage,
  stepCountIs,
} from "ai";

import { getClientDetailsTool } from "@/utils/ai/vercel/toolManager/tools/client/client";
import {
  getClientNotesTool,
  getAllClientsTool,
  getRawFitbitDataTool,
  saveClientNoteTool,
  getCurrentDateAndTimeTool,
} from "@/utils/ai/vercel/toolManager/tools/client/client";
import { sqlQueryTool } from "@/utils/ai/vercel/toolManager/tools/db/prisma";
import * as ToolManager from "@/utils/ai/vercel/toolManager/toolManager";
import { LLMType } from "@/utils/ai/types";

export async function POST(req: Request) {
  const {
    messages,
    selectedModel,
    tools,
  }: {
    messages: UIMessage[];
    selectedModel?: LLMType;
    tools: ToolManager.ToolType[];
  } = await req.json();

  let model;
  switch (selectedModel) {
    case "Gemini-2.5-flash":
      console.log("Using Gemini model");
      model = google("gemini-2.5-flash");
      break;
    case "Gemini-2.5-flash-lite":
      console.log("Using Gemini Lite model");
      model = google("gemini-2.5-flash-lite");
      break;
    case "ChatGPT":
      console.log("Using ChatGpt model");
      model = openai("gpt-3.5-turbo");
      break;
    case "Groq":
      console.log("Using Groq model");
      model = groq("llama-3.1-8b-instant");
      break;
    default:
      console.log("No model selected, defaulting to Gemini");
      model = google("gemini-2.5-flash");
      break;
  }

  const llmTools = ToolManager.getTools(tools);

  const result = streamText({
    model: model,
    system: "You are a helpful assistant.",
    messages: convertToModelMessages(messages),
    tools: llmTools,
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
