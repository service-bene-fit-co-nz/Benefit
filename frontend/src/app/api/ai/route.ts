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
  getClientIdByNameTool,
  getAllClientsTool,
  getRawFitbitDataTool,
} from "@/utils/ai/vercel/toolManager/tools/client/client";

export async function POST(req: Request) {
  const {
    messages,
    selectedModel,
  }: { messages: UIMessage[]; selectedModel?: "Gemini" | "ChatGPT" | "Groq" } =
    await req.json();

  let model;
  switch (selectedModel) {
    case "Gemini":
      console.log("Using Gemini model");
      model = google("gemini-2.5-flash");
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

  console.log(
    "OpenAI Key Status:",
    process.env.OPENAI_API_KEY ? "Loaded" : "MISSING"
  );

  const result = streamText({
    model: model,
    system: "You are a helpful assistant.",
    messages: convertToModelMessages(messages),
    tools: {
      //getClientIdByName: getClientIdByNameTool,
      getAllClients: getAllClientsTool,
      getClientDetails: getClientDetailsTool,
      getClientNotes: getClientNotesTool,
      getRawFitbitData: getRawFitbitDataTool,
    },
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
