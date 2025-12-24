import { vercelStreamAgentQuery } from "@/utils/ai/vercel/agent/vercelAgent";
import { type UIMessage } from "ai";
import { LLMType, ToolType } from "@/utils/ai/types";

export async function POST(req: Request) {
  const {
    messages,
    selectedModel,
    tools,
  }: {
    messages: UIMessage[];
    selectedModel?: LLMType;
    tools: ToolType[];
  } = await req.json();

  console.log("API Received Post...");
  const result = await vercelStreamAgentQuery({
    messages,
    selectedModel,
    tools,
  });

  return result.toUIMessageStreamResponse();
}
