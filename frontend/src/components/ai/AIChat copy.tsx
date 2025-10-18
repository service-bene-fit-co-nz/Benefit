'use client';
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { agentQuery } from "@/utils/ai/agent/chatAgent";
import { AIConversation } from "@/utils/ai/agent/agentTypes";

interface Message {
  id: string | number;
  content: string;
  type: "user" | "ai" | "error";
}

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      type: "user",
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");

    const request: AIConversation = {
      toolList: [],
      model: "Gemini", // Or make this selectable
      prompt: "You are a helpful assistant.",
      conversation: newMessages,
    };

    const aiResponse = await agentQuery(request);

    const aiMessage: Message = {
      id: aiResponse.id,
      content: aiResponse.content,
      type: aiResponse.type,
    };

    setMessages((prevMessages) => [...prevMessages, aiMessage]);
  };

  return (
    <div className="flex flex-col h-full w-full bg-background border rounded-lg shadow-lg">
      <ScrollArea className="flex-grow p-4">
        <div className="flex flex-col gap-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-end gap-2",
                message.type === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "p-3 rounded-lg max-w-xs lg:max-w-md",
                  message.type === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow"
          />
          <Button type="submit">Send</Button>
        </form>
      </div>
    </div>
  );
}