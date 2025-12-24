"use client";
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
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
import { PaperclipIcon, RotateCcwIcon } from "lucide-react";

import { useChat, type UIMessage } from "@ai-sdk/react";
import { type ToolType } from "@/utils/ai/types";
import { useAuth } from "@/hooks/use-auth";
import { type FormEventHandler, useCallback, useEffect, useState } from "react";
import { LLMType } from "@/utils/ai/types";
import { DefaultChatTransport } from "ai";
import { useQuery } from "@tanstack/react-query";
import {
  fetchPrompts,
  type PromptData,
} from "@/server-actions/admin/prompts/actions";
import {
  fetchClientWithAllData,
  type ClientWithAllData,
} from "@/server-actions/client/actions";
import { getPrismaSchemaContext } from "@/server-actions/ai/actions";

const models: { id: LLMType; name: string }[] = [
  { id: "Gemini-2.5-flash-lite", name: "Gemini-2.5-flash-lite" },
  { id: "Gemini-2.5-flash", name: "Gemini-2.5-flash" },
  { id: "ChatGPT", name: "ChatGPT" },
  { id: "Groq", name: "Groq" },
];

function FacebookMessageHistory({ data }: { data: any }) {
  // Handle error states returned by your tool
  if (data.error)
    return <div className="text-destructive text-sm p-2">{data.error}</div>;
  if (!Array.isArray(data)) return null;

  return (
    <div className="flex flex-col gap-3 my-4">
      <div className="text-[10px] font-bold text-muted-foreground uppercase px-1">
        Messenger History
      </div>
      {data.map((fbMsg: any, idx: number) => (
        <Card key={idx} className="bg-muted/30 border-none shadow-none">
          <CardContent className="p-3 space-y-2">
            {fbMsg.text && (
              <p className="text-sm leading-relaxed">{fbMsg.text}</p>
            )}

            {fbMsg.attachments?.map((attachment: any, i: number) => (
              <div key={i} className="pt-1">
                {/* Image Rendering */}
                {attachment.type === "image" && (
                  <div className="max-w-[200px] overflow-hidden rounded-md border">
                    <AspectRatio ratio={1}>
                      <img
                        src={attachment.url}
                        className="object-cover h-full w-full"
                        alt="FB"
                      />
                    </AspectRatio>
                  </div>
                )}

                {/* Audio Playback */}
                {attachment.type === "audio" && (
                  <div className="flex items-center gap-2 bg-background p-2 rounded-lg border">
                    <audio controls className="h-6 w-full max-w-[200px]">
                      <source src={attachment.url} />
                    </audio>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function AIChatConversation({
  llmTools,
  hasTrainerPrompt,
  authId,
}: {
  llmTools: ToolType[];
  hasTrainerPrompt: boolean;
  authId?: string;
}) {
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState("");
  const [selectedModel, setSelectedModel] = useState<LLMType>(models[0].id);
  const [selectedPrompt, setSelectedPrompt] = useState<string | undefined>();

  const { data: prompts, isLoading: promptsLoading } = useQuery<PromptData[]>({
    queryKey: ["prompts"],
    queryFn: () => fetchPrompts(),
    enabled: hasTrainerPrompt,
  });

  const { data: dbContext, isLoading: dbContextLoading } = useQuery({
    queryKey: ["prismaSchemaContext"],
    queryFn: () => getPrismaSchemaContext(),
  });

  const { data: clientDataResult, isLoading: clientDataLoading } = useQuery({
    queryKey: ["clientWithAllData", authId],
    queryFn: async () => {
      if (!authId) return null;
      const result = await fetchClientWithAllData(authId);
      if (!result.success) {
        console.error(result.message);
        return null;
      }
      return result.data;
    },
    enabled: !!authId,
  });
  const clientData = clientDataResult as ClientWithAllData | null;

  const systemContext =
    "You are a helpful and knowledgeable fitness and nutrition assistant. Provide accurate and concise information to help users achieve their health goals.";

  const { messages, sendMessage, setMessages, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai",
    }),
  });

  useEffect(() => {
    const selected = prompts?.find((p) => p.id === selectedPrompt);
    let context = selected ? selected.prompt : systemContext;

    if (dbContext) {
      context += "\n\n" + dbContext;
    }
    if (clientData) {
      context +=
        "\n\n--- Client Data ---\n" +
        `\n\n
        In this conversation you will be speaking to the person described in the following data. 
        This person is the person currently logged into the application.
        They will refer to themselves as I or me. PLease use their first name when addressing them.
        PLease provide an initial greeting to start the conversation based on the following data.
        \n` +
        JSON.stringify(clientData, null, 2);
    }

    const newSystemMessage: UIMessage = {
      id: "system-context",
      role: "system",
      parts: [{ type: "text", text: context }],
    };

    setMessages((currentMessages) => {
      const systemMessageIndex = currentMessages.findIndex(
        (m) => m.role === "system"
      );

      if (currentMessages.length === 0) {
        return [newSystemMessage];
      }

      if (systemMessageIndex !== -1) {
        const newMessages = [...currentMessages];
        const systemMessage = newMessages[systemMessageIndex];

        if (systemMessage.parts[0]?.type === "text") {
          if (systemMessage.parts[0].text !== context) {
            newMessages[systemMessageIndex] = newSystemMessage;
            return newMessages;
          }
        } else {
          // The existing system message part is not text, so we replace it.
          newMessages[systemMessageIndex] = newSystemMessage;
          return newMessages;
        }
        return currentMessages;
      } else {
        return [newSystemMessage, ...currentMessages];
      }
    });
  }, [
    dbContext,
    clientData,
    selectedPrompt,
    prompts,
    setMessages,
    systemContext,
  ]);

  const isThinking = status === "submitted" || status === "streaming";

  const handleModelChange = (modelId: LLMType) => {
    setSelectedModel(modelId);
  };

  const handlePromptChange = (promptId: string) => {
    setSelectedPrompt(promptId);
  };

  const isLoading =
    (status as string) === "loading" ||
    (status as string) === "streaming-final-response";

  const isAnythingLoading: boolean =
    isLoading || promptsLoading || dbContextLoading || clientDataLoading;

  const body: any = {
    selectedModel: selectedModel,
    tools: llmTools,
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
          {messages
            .filter((m) => m.role !== "system")
            .map((message) => (
              <div key={message.id} className="space-y-3">
                <Message from={message.role}>
                  <MessageContent>
                    {message.role === "assistant" &&
                    !message.parts.some(
                      (part) => part.type === "text" && part.text.length > 0
                    ) ? (
                      <div className="flex items-center gap-2">
                        <Loader size={14} />
                        <span className="text-muted-foreground text-sm">
                          Thinking...
                        </span>
                      </div>
                    ) : (
                      message.parts?.map((part, i) => {
                        // 1. Text Parts
                        if (part.type === "text") {
                          return message.role === "assistant" ? (
                            <Response key={`${message.id}-${i}`}>
                              {part.text}
                            </Response>
                          ) : (
                            <div key={`${message.id}-${i}`}>{part.text}</div>
                          );
                        }

                        // 2. Specific Tool Part (New Pattern)
                        // The type is now "tool-" + your tool name
                        if (
                          part.type ===
                          "tool-getCurrentClientFacebookMessagesTool"
                        ) {
                          // In SDK 5/6, properties are flat on the part object
                          const { toolCallId, state } = part;

                          if (state === "output-available") {
                            // "output" contains the data returned by your 'execute' function
                            return (
                              <FacebookMessageHistory
                                key={toolCallId}
                                data={part.output}
                              />
                            );
                          }

                          if (
                            state === "input-available" ||
                            state === "input-streaming"
                          ) {
                            return (
                              <div
                                key={toolCallId}
                                className="flex items-center gap-2 py-2 italic text-xs text-muted-foreground"
                              >
                                <Loader size={12} className="animate-spin" />
                                Fetching messenger history...
                              </div>
                            );
                          }
                        }

                        return null;
                      })
                    )}
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
              <PromptInputButton disabled={isAnythingLoading}>
                <PaperclipIcon size={16} />
              </PromptInputButton>
              {/*<PromptInputButton disabled={isAnythingLoading}>
                <MicIcon size={16} />
                <span>Voice</span>
              </PromptInputButton>
              <PromptInputButton disabled={isAnythingLoading}>
                <UserRoundCheck size={16} />
              </PromptInputButton> 
              */}
              {hasTrainerPrompt && (
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
              )}

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
