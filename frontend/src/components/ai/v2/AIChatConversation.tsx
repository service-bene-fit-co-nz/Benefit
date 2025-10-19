"use client";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ui/shadcn-io/ai/conversation";
import { Loader } from "@/components/ui/shadcn-io/ai/loader";
import {
  Message,
  MessageAvatar,
  MessageContent,
} from "@/components/ui/shadcn-io/ai/message";
import {
  PromptInput,
  PromptInputButton,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@/components/ui/shadcn-io/ai/prompt-input";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ui/shadcn-io/ai/reasoning";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ui/shadcn-io/ai/source";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MicIcon, PaperclipIcon, RotateCcwIcon } from "lucide-react";
import { nanoid } from "nanoid";
import { type FormEventHandler, useCallback, useEffect, useState } from "react";

import { agentQuery } from "@/utils/ai/agent/chatAgent";
import { AIConversation, AIContent, LLMType } from "@/utils/ai/agent/agentTypes";

type ChatMessage = {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  reasoning?: string;
  sources?: Array<{ title: string; url: string }>;
  isStreaming?: boolean;
};

const models: { id: LLMType; name: string }[] = [
  { id: "Gemini", name: "Gemini" },
  { id: "ChatGPT", name: "ChatGPT" },
  { id: "Groq", name: "Groq" },
];

const initialMessages: ChatMessage[] = [
  {
    id: nanoid(),
    content:
      "Hello! I'm your AI assistant. I can help you with coding questions, explain concepts, and provide guidance on web development topics. What would you like to know?",
    role: "assistant",
    timestamp: new Date(),
    sources: [
      { title: "Getting Started Guide", url: "#" },
      { title: "API Documentation", url: "#" },
    ],
  },
];

export function AIChatConversation() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [selectedModel, setSelectedModel] = useState<LLMType>(models[0].id);
  const [isTyping, setIsTyping] = useState(false);

  const handleSubmit: FormEventHandler<HTMLFormElement> = useCallback(async (event) => {
    event.preventDefault();
    
    if (!inputValue.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: nanoid(),
      content: inputValue.trim(),
      role: "user",
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      const conversationRequest: AIConversation = {
        model: selectedModel,
        prompt: "You are a helpful assistant.", // This can be made dynamic
        toolList: [], // This can be made dynamic
        conversation: messages.map(msg => ({ id: msg.id, content: msg.content, type: msg.role === 'user' ? 'user' : 'ai' })),
      };

      const aiResponse = await agentQuery(conversationRequest);

      const assistantMessage: ChatMessage = {
        id: nanoid(),
        content: aiResponse.content,
        role: 'assistant',
        timestamp: new Date(),
        isStreaming: false, // Assuming agentQuery returns full content, not streaming
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error: any) {
      console.error("Error calling agentQuery:", error);
      setMessages(prev => [
        ...prev,
        { id: nanoid(), content: `Error: ${error.message}`, role: 'assistant', timestamp: new Date(), isStreaming: false },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [inputValue, isTyping, messages, selectedModel]);

  const handleReset = useCallback(() => {
    setMessages(initialMessages);
    setInputValue("");
    setIsTyping(false);
  }, []);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border bg-background shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-green-500" />
            <span className="font-medium text-sm">AI Assistant</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <span className="text-muted-foreground text-xs">
            {models.find((m) => m.id === selectedModel)?.name}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-8 px-2"
        >
          <RotateCcwIcon className="size-4" />
          <span className="ml-1">Reset</span>
        </Button>
      </div>
      {/* Conversation Area */}
      <Conversation className="flex-1">
        <ConversationContent className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="space-y-3">
              <Message from={message.role}>
                <MessageContent from={message.role}>
                  {message.isStreaming && message.content === "" ? (
                    <div className="flex items-center gap-2">
                      <Loader size={14} />
                      <span className="text-muted-foreground text-sm">
                        Thinking...
                      </span>
                    </div>
                  ) : (
                    message.content
                  )}
                </MessageContent>
                <MessageAvatar
                  src={
                    message.role === "user"
                      ? "https://github.com/dovazencot.png"
                      : "https://github.com/vercel.png"
                  }
                  name={message.role === "user" ? "User" : "AI"}
                />
              </Message>
              {/* Reasoning */}
              {message.reasoning && (
                <div className="ml-10">
                  <Reasoning
                    isStreaming={message.isStreaming}
                    defaultOpen={false}
                  >
                    <ReasoningTrigger />
                    <ReasoningContent>{message.reasoning}</ReasoningContent>
                  </Reasoning>
                </div>
              )}
              {/* Sources */}
              {message.sources && message.sources.length > 0 && (
                <div className="ml-10">
                  <Sources>
                    <SourcesTrigger count={message.sources.length} />
                    <SourcesContent>
                      {message.sources.map((source, index) => (
                        <Source
                          key={index}
                          href={source.url}
                          title={source.title}
                        />
                      ))}
                    </SourcesContent>
                  </Sources>
                </div>
              )}
            </div>
          ))}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      {/* Input Area */}
      <div className="border-t p-4">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me anything about development, coding, or technology..."
            disabled={isTyping}
          />
          <PromptInputToolbar>
            <PromptInputTools>
              <PromptInputButton disabled={isTyping}>
                <PaperclipIcon size={16} />
              </PromptInputButton>
              <PromptInputButton disabled={isTyping}>
                <MicIcon size={16} />
                <span>Voice</span>
              </PromptInputButton>
              <PromptInputModelSelect
                value={selectedModel}
                onValueChange={(value) => setSelectedModel(value as LLMType)}
                disabled={isTyping}
              >
                <PromptInputModelSelectTrigger>
                  <PromptInputModelSelectValue />
                </PromptInputModelSelectTrigger>
                <PromptInputModelSelectContent>
                  {models.map((model) => (
                    <PromptInputModelSelectItem key={model.id} value={model.id}>
                      {model.name}
                    </PromptInputModelSelectItem>
                  ))}
                </PromptInputModelSelectContent>
              </PromptInputModelSelect>
            </PromptInputTools>
            <PromptInputSubmit
              disabled={!inputValue.trim() || isTyping}
              status={isTyping ? "streaming" : "ready"}
            />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
}