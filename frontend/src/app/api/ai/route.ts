import { vercelStreamAgentQueryLLM } from "@/utils/ai/vercel/agent/vercelAgent";
import { type UIMessage } from "ai";
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

  console.log("API Received Post...");
  const result = await vercelStreamAgentQueryLLM({
    messages,
    selectedModel,
    tools,
  });

  return result.toUIMessageStreamResponse();
}
