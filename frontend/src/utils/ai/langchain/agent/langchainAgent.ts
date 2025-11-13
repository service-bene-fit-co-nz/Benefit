// actions/chat.ts
"use server"; // <--- Essential: Marks the file as a Server Component/Action

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { AIMessage, HumanMessage, BaseMessage } from "@langchain/core/messages";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

// Define the shape of the history passed from the client
interface ClientMessage {
  role: "user" | "ai";
  content: string;
}

/**
 * Converts a client-friendly message array to LangChain's BaseMessage array.
 * @param history The conversation history from the client.
 * @returns An array of LangChain BaseMessage objects.
 */
const convertToLangChainMessages = (
  history: ClientMessage[]
): BaseMessage[] => {
  return history.map((msg) =>
    msg.role === "user"
      ? new HumanMessage(msg.content)
      : new AIMessage(msg.content)
  );
};

// --- Configuration ---

// 1. Initialize the Chat Model (Gemini)
// The key is automatically picked up from GEMINI_API_KEY in the .env.local file
const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  streaming: true, // Enable streaming for efficiency
});

// 2. Define the Prompt Template
const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "You are a helpful and friendly AI assistant powered by Gemini. Keep your answers concise and accurate.",
  ],
  new MessagesPlaceholder("history"),
  ["human", "{input}"],
]);

// 3. Define the Chain using LCEL
const chatChain = RunnableSequence.from([
  prompt,
  model,
  new StringOutputParser(),
]);

/**
 * The core chat Server Action.
 * @param message The new user message.
 * @param history The previous conversation history.
 * @returns A streamed response containing the AI's content.
 */
export async function chatAction(
  message: string,
  history: ClientMessage[]
): Promise<ReadableStream<Uint8Array>> {
  if (!message) {
    throw new Error("Message cannot be empty.");
  }

  // Convert client history to LangChain format
  const langChainHistory = convertToLangChainMessages(history);

  try {
    // Stream the chain with the current message and full history
    const stream = await chatChain.stream({
      input: message,
      history: langChainHistory,
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      },
    });

    return readableStream;
  } catch (error) {
    console.error("Gemini Chat Action Error:", error);
    // Create a simple error stream to return to the client
    const errorMessage = "An error occurred while fetching the response.";
    const encoder = new TextEncoder();
    return new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(errorMessage));
        controller.close();
      },
    });
  }
}
