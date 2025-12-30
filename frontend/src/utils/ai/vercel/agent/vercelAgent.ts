"use server";
import { LLMType, ToolIdentifier } from "./../../ai-types";
import { HumanMessage } from "@langchain/core/messages";
import { getLLM, createModel } from "@/utils/ai-utils";
import {
  convertToModelMessages,
  streamText,
  type UIMessage,
  stepCountIs,
  type Tool,
} from "ai";
import * as VercelToolManager from "@/utils/ai/vercel/toolManager/toolManager";
import { getRelevantToolsLLM } from "../toolManager/toolRouterLLM";

const getLastMessageText = (messages: UIMessage[]): string | undefined => {
  if (messages.length === 0) {
    return undefined;
  }
  const lastMessage = messages[messages.length - 1];
  const textPart = lastMessage.parts.find(
    (part): part is { type: "text"; text: string } => part.type === "text"
  );
  return textPart?.text;
};

const getTools = async (
  preProcessorModel: LLMType,
  prompt: string,
  tools: ToolIdentifier[]
): Promise<{ [key: string]: Tool } | undefined> => {
  const relevantTools = await getRelevantToolsLLM(
    preProcessorModel,
    prompt || "",
    tools
  );

  if (Object.keys(relevantTools).length === 0) {
    if (process.env.NODE_ENV === "development") {
      console.log("No tools are needed for this query.");
    }
    return undefined;
  }

  if (process.env.NODE_ENV === "development") {
    const toolInfo = Object.entries(relevantTools).map(([name, tool]) => ({
      name,
      description: tool.description,
    }));
    console.log("Relevant tools:", JSON.stringify(toolInfo, null, 2));
  }
  return relevantTools;
};

export const vercelStreamAgentQuery = async ({
  messages,
  preProcessorModel,
  selectedModel,
  tools,
}: {
  messages: UIMessage[];
  preProcessorModel: LLMType;
  selectedModel: LLMType;
  tools: ToolIdentifier[];
}) => {
  "use server";

  try {
    const currentUserMessage = getLastMessageText(messages);
    const llmTools = await getTools(
      preProcessorModel,
      currentUserMessage || "",
      tools
    );
    const result = streamText({
      model: createModel(selectedModel as LLMType),
      system: "You are a helpful assistant.",
      messages: convertToModelMessages(messages),
      tools: llmTools,
      stopWhen: stepCountIs(5),
      onAbort: () => {
        console.log("Agent query was aborted by the user.");
      },
      onError: (error: unknown) => {
        console.error("Error during agent query streaming:", error);
      },
      onFinish: () => {
        console.log("Agent query streaming finished.");
      },
      onStepFinish: (step) => {
        console.log("Finished step:", step);
      },
      onChunk: (chunk) => {
        console.log("Received chunk:", chunk);
      },
    });
    return result;
  } catch (error) {
    const errorMessageText = `An unexpected error occurred during the agent query: ${
      error instanceof Error ? error.message : String(error)
    }`;
    const errorMessage: UIMessage = {
      id: Date.now().toString(),
      role: "assistant",
      parts: [{ type: "text", text: errorMessageText }],
    };
    messages.push(errorMessage);
    throw error; // Re-throw the error for the calling function to handle
  }
};
