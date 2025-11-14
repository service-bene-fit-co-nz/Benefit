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
import { Response } from "@/components/ui/shadcn-io/ai/response";
import { Button } from "@/components/ui/button";
import { MicIcon, PaperclipIcon, RotateCcwIcon } from "lucide-react";

import {
  useChat,
  UIMessage as VercelMessage,
  UseChatHelpers,
} from "@ai-sdk/react";
import * as ToolManager from "@/utils/ai/langchain/toolManager/toolManager";
import { useAuth } from "@/hooks/use-auth";
import { ClientForTrainer } from "@/server-actions/trainer/clients/actions";
import { type FormEventHandler, useCallback, useState } from "react";
import { LLMType } from "@/utils/ai/types";
import { DefaultChatTransport } from "ai";
import { type UIMessage } from "@ai-sdk/react";

const models: { id: LLMType; name: string }[] = [
  { id: "Gemini", name: "Gemini" },
  { id: "ChatGPT", name: "ChatGPT" },
  { id: "Groq", name: "Groq" },
];

export function AIChatConversation({
  llmTools,
  selectedClient,
}: {
  llmTools: ToolManager.ToolType[];
  selectedClient?: ClientForTrainer;
}) {
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState("");
  const [selectedModel, setSelectedModel] = useState<LLMType>(models[0].id);

  const { messages, sendMessage, setMessages, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  const isLoading =
    (status as string) === "loading" ||
    (status as string) === "streaming-final-response";

  // const typedSendMessage: UseChatHelpers<VercelMessage>["sendMessage"] =
  //   sendMessage;

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    if (!inputValue.trim()) return;

    sendMessage({ text: inputValue });
    // sendMessage(
    //   [{ type: "text" as const, text: inputValue }] as const, // <-- 💡 Add 'as const' here
    //   {
    //     data: {
    //       llmTools,
    //       model: selectedModel,
    //     },
    //   }
    // );

    setInputValue("");
  };

  const handleReset = useCallback(() => {
    setMessages([]);
    setInputValue("");
  }, [setMessages]);

  return (
    <>
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
                <MessageContent>
                  {message.parts.map((part, index) => {
                    // 1. Check if the part is a TextUIPart (type: 'text')
                    if (part.type === "text") {
                      const textContent = (
                        <Response key={index}>{part.text}</Response>
                      );

                      // 2. Apply the <Response> wrapper only for the 'assistant'
                      return message.role === "assistant"
                        ? textContent
                        : part.text;
                    }

                    // 3. Add logic here to handle other parts (tool calls, data, etc.)
                    // Example:
                    // if (part.type === 'tool') {
                    //   return <ToolCallRenderer key={index} tool={part.tool} />;
                    // }

                    return null; // Ignore unsupported parts for now
                  })}
                </MessageContent>
                <MessageAvatar
                  src={
                    message.role === "user"
                      ? user?.image || "/images/bene-fit.jpeg"
                      : "/images/bene-fit.jpeg"
                  }
                  name={message.role === "user" ? user?.name || "User" : "AI"}
                />
              </Message>
            </div>
          ))}
          {isLoading && (
            <div className="space-y-3">
              <Message from="assistant">
                <MessageContent>
                  <div className="flex items-center gap-2">
                    <Loader size={14} />
                    <span className="text-muted-foreground text-sm">
                      Thinking...
                    </span>
                  </div>
                </MessageContent>
                <MessageAvatar src="/images/bene-fit.jpeg" name="AI" />
              </Message>
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Input Area */}
      <div className="border-t p-4">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me anything lets talk fitness..."
            disabled={isLoading}
          />
          <PromptInputToolbar>
            <PromptInputTools>
              <PromptInputButton disabled={isLoading}>
                <PaperclipIcon size={16} />
              </PromptInputButton>
              <PromptInputButton disabled={isLoading}>
                <MicIcon size={16} />
                <span>Voice</span>
              </PromptInputButton>
              <PromptInputModelSelect
                value={selectedModel}
                onValueChange={(value) => setSelectedModel(value as LLMType)}
                disabled={isLoading}
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
              disabled={!inputValue.trim() || isLoading}
              status={isLoading ? "streaming" : "ready"}
            />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </>
  );
}
