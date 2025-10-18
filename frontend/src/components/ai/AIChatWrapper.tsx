'use client';

import { useState } from "react";
import { Conversation, ConversationContent, ConversationScrollButton } from "./AIChat"; // AIChat is now Conversation
import { PromptInput, PromptInputTextarea, PromptInputSubmit } from "./PromptInput";
import { Message, MessageContent } from "./Message";
import { Response } from "./Response";
import { agentQuery } from "@/utils/ai/agent/chatAgent";
import { AIConversation } from "@/utils/ai/agent/agentTypes";

interface ChatMessage {
  id: string | number;
  content: string;
  type: "user" | "ai" | "error";
}

export function AIChatWrapper() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: input,
      type: "user",
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");

    const request: AIConversation = {
      toolList: [], // You can add tools here if needed
      model: "Gemini", // Or make this selectable
      prompt: "You are a helpful assistant.",
      conversation: newMessages,
    };

    const aiResponse = await agentQuery(request);

    const aiMessage: ChatMessage = {
      id: aiResponse.id,
      content: aiResponse.content,
      type: aiResponse.type,
    };

    setMessages((prevMessages) => [...prevMessages, aiMessage]);
  };

  return (
    <Conversation className="relative w-full h-full">
      <ConversationContent>
        {messages.map((message) => (
          <Message key={message.id} from={message.type === "user" ? "user" : "assistant"}>
            <MessageContent>
              <Response>{message.content}</Response>
            </MessageContent>
          </Message>
        ))}
      </ConversationContent>
      <ConversationScrollButton />
      <div className="absolute bottom-0 w-full p-4 bg-background border-t">
        <form onSubmit={handleSendMessage}>
          <PromptInput>
            <PromptInputTextarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
            />
            <PromptInputSubmit />
          </PromptInput>
        </form>
      </div>
    </Conversation>
  );
}