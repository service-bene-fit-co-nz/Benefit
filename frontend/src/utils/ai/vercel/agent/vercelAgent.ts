import { LLMType } from "./../../types";
("use server");
import { BaseMessage, AIMessage, HumanMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import {
  AIConversation,
  AIContent,
  AIError,
} from "../../langchain/agent/agentTypes";
import { getTool } from "@/utils/ai/langchain/toolManager/toolManager";
import { getLLM } from "@/utils/ai-utils";

const determineIfToolsNeeded = async (
  llm: any,
  lastMessage: string
): Promise<boolean> => {
  const response = await llm.invoke([
    new HumanMessage(
      `Does this query require external tools/data? Answer only "YES" or "NO". Query: ${lastMessage}`
    ),
  ]);
  return response.content.toString().toUpperCase().includes("YES");
};

export const agentQuery = async (
  request: AIConversation
): Promise<AIContent> => {
  try {
    const currentUserMessage =
      request.conversation[request.conversation.length - 1].content;
    const toolsNeeded = await determineIfToolsNeeded(
      getLLM("Gemini-1.5-flash"),
      currentUserMessage
    );

    let tools: any[] = [];
    if (toolsNeeded) {
      console.log("Tools are needed for this query.");

      tools = request.toolList.map((toolId) => {
        return getTool(toolId);
      });
    } else {
      console.log("No tools are needed for this query.");
    }

    const llm = getLLM(request.model);

    const agent = await createReactAgent({
      llm,
      tools: tools,
      prompt: "You are a helpful assistant.\n" + request.prompt,
    });

    const chatMessages: BaseMessage[] = request.conversation
      .filter((item) => item.type === "user" || item.type === "ai")
      .map((item) => {
        if (item.type === "user") {
          return new HumanMessage(item.content);
        } else if (item.type === "ai") {
          return new AIMessage(item.content);
        }
        throw new Error(`Unknown message type: ${item.type}`);
      });

    const result = await agent.invoke({
      messages: chatMessages,
    });

    //console.log(JSON.stringify(result, null, 2));

    const serializedMessages = result.messages.map((msg: BaseMessage) => {
      // Determine message type and extract relevant data
      if (msg.getType() === "human") {
        return {
          role: "user",
          content: msg.content,
          // Add other plain properties you need from HumanMessage
        };
      } else if (msg.getType() === "ai") {
        return {
          role: "ai",
          content: msg.content,
          // Add other plain properties you need from AIMessage, e.g., tool_calls if applicable
          tool_calls: (msg as AIMessage).tool_calls, // Cast to AIMessage to access tool_calls if they exist
          response_metadata: (msg as AIMessage).response_metadata, // Example: for token usage
        };
      }
      // Handle other message types if necessary
      return { role: "unknown", content: "Could not serialize message" };
    });

    if (serializedMessages.length) {
      return {
        id: (Date.now() + 1).toString(),
        content:
          serializedMessages[serializedMessages.length - 1].content.toString(),
        type: "ai",
      };
    }
    throw new AIError("Undefined Groq response error");
  } catch (error: any) {
    if (error instanceof AIError) {
      return {
        id: (Date.now() + 1).toString(),
        content: error.message,
        type: "error",
      };
    }
    return {
      id: (Date.now() + 1).toString(),
      content: `An Error occurred: ${error.message}`,

      type: "error",
    };
  }
};
