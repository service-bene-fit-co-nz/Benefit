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
import { Combobox } from "@/components/ui/combobox";
import {
  MicIcon,
  PaperclipIcon,
  RotateCcwIcon,
  UserRoundCheck,
} from "lucide-react";

import { useChat, type UIMessage } from "@ai-sdk/react";
import * as ToolManager from "@/utils/ai/langchain/toolManager/toolManager";
import { useAuth } from "@/hooks/use-auth";
import { ClientForTrainer } from "@/server-actions/trainer/clients/actions";
import { type FormEventHandler, useCallback, useState } from "react";
import { LLMType } from "@/utils/ai/types";
import { DefaultChatTransport } from "ai";
import { useQuery } from "@tanstack/react-query";
import {
  fetchPrompts,
  type PromptData,
} from "@/server-actions/admin/prompts/actions";
import {
  readAllClients,
  type ClientSearchResult,
} from "@/server-actions/admin/clients/actions";

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
  const [selectedPrompt, setSelectedPrompt] = useState<string | undefined>();
  const [selectedClientId, setSelectedClientId] = useState<
    string | undefined
  >();

  const { data: prompts, isLoading: promptsLoading } = useQuery<PromptData[]>({
    queryKey: ["prompts"],
    queryFn: () => fetchPrompts(),
  });

  const { data: clientsResult, isLoading: clientsLoading } = useQuery({
    queryKey: ["allClients"],
    queryFn: () => readAllClients(),
  });

  const clients = clientsResult?.success ? clientsResult.data : [];

  const systemContext =
    "You are a helpful and knowledgeable fitness and nutrition assistant. Provide accurate and concise information to help users achieve their health goals.";

  const initialContext: UIMessage[] = [
    {
      id: "system-context", // A unique ID
      role: "system",
      parts: [{ type: "text", text: systemContext }],
      // Note: The system message content is usually not rendered in the UI,
      // but its role is to instruct the model on the backend.
    },
  ];

  const { messages, sendMessage, setMessages, status } = useChat({
    messages: initialContext,
    transport: new DefaultChatTransport({
      api: "/api/ai",
    }),
  });

  const isThinking = status === "submitted" || status === "streaming";

  const handleModelChange = (modelId: LLMType) => {
    setSelectedModel(modelId);
  };

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
  };

  const handlePromptChange = (promptId: string) => {
    setSelectedPrompt(promptId);
    const selected = prompts?.find((p) => p.id === promptId);
    if (selected) {
      const newSystemMessage: UIMessage = {
        id: "system-context",
        role: "system",
        parts: [{ type: "text", text: selected.prompt }],
      };
      setMessages((currentMessages) => {
        const systemMessageIndex = currentMessages.findIndex(
          (m) => m.role === "system"
        );
        if (systemMessageIndex !== -1) {
          const newMessages = [...currentMessages];
          newMessages[systemMessageIndex] = newSystemMessage;
          return newMessages;
        } else {
          return [...currentMessages, newSystemMessage];
        }
      });
    }
  };

  const isLoading =
    (status as string) === "loading" ||
    (status as string) === "streaming-final-response";

  const isAnythingLoading: boolean =
    isLoading || promptsLoading || clientsLoading;

  const body: any = {
    selectedModel: selectedModel,
    selectedClientId: selectedClientId,
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    if (!inputValue.trim()) return;
    sendMessage(
      {
        role: "user",
        parts: [{ type: "text", text: inputValue }],
      },
      {
        body: body,
      }
    );
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
          {isThinking && (
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
            disabled={isAnythingLoading}
          />
          <PromptInputToolbar>
            <PromptInputTools>
              {/* 
              <PromptInputButton disabled={isAnythingLoading}>
                <PaperclipIcon size={16} />
              </PromptInputButton>
              <PromptInputButton disabled={isAnythingLoading}>
                <MicIcon size={16} />
                <span>Voice</span>
              </PromptInputButton>
              <PromptInputButton disabled={isAnythingLoading}>
                <UserRoundCheck size={16} />
              </PromptInputButton> 
              */}
              <Combobox
                options={
                  clients?.map((client) => ({
                    value: client.id,
                    label: `${client.firstName} ${client.lastName}`,
                  })) || []
                }
                value={selectedClientId}
                onValueChange={handleClientChange}
                placeholder="Select a client"
                disabled={isAnythingLoading}
                className="w-[180px]"
              />
              <Combobox
                options={
                  prompts?.map((prompt) => ({
                    value: prompt.id,
                    label: prompt.title,
                  })) || []
                }
                value={selectedPrompt}
                onValueChange={handlePromptChange}
                placeholder="Select a prompt"
                disabled={isAnythingLoading}
                className="w-[180px]"
              />

              <PromptInputModelSelect
                value={selectedModel}
                onValueChange={handleModelChange}
                disabled={isAnythingLoading}
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
              disabled={!inputValue.trim() || isAnythingLoading}
              status={isAnythingLoading ? "streaming" : "ready"}
            />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </>
  );
}
