import { vercelStreamAgentQuery } from "@/utils/ai/vercel/agent/vercelAgent";
import { type UIMessage } from "ai";
import { LLMType, ToolIdentifier } from "@/utils/ai/ai-types";

export async function POST(req: Request) {
  try {
    const {
      messages,
      preProcessorModel,
      selectedModel,
      tools,
    }: {
      messages: UIMessage[];
      preProcessorModel: LLMType;
      selectedModel: LLMType;
      tools: ToolIdentifier[];
    } = await req.json();

    console.log("API Received Post...");
    const result = await vercelStreamAgentQuery({
      messages,
      preProcessorModel,
      selectedModel,
      tools,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Error in AI API route:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
