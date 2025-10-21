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
import { Response } from "@/components/ui/shadcn-io/ai/response";
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
import {
  AIConversation,
  AIContent,
  LLMType,
} from "@/utils/ai/agent/agentTypes";
import { useAuth } from "@/hooks/use-auth";
import { ToolType } from "@/utils/ai/toolManager/toolManager";
import { ClientForTrainer } from "@/server-actions/trainer/clients/actions";

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
      "Hello! I'm your Benefit fitness assistant. Who should we help today?",
    role: "assistant",
    timestamp: new Date(),
    sources: [],
  },
];

// Helper function to format client details as Markdown
const formatClientDetailsAsMarkdown = (client: ClientForTrainer): string => {
  let markdown = `### Client Details:\n\n`;
  markdown += `*   **Name:** ${client.name}\n`;
  markdown += `*   **Email:** ${client.email}\n`;
  if (client.phone) markdown += `*   **Phone:** ${client.phone}\n`;
  if (client.dateOfBirth)
    markdown += `*   **Date of Birth:** ${client.dateOfBirth}\n`;
  if (client.gender) markdown += `*   **Gender:** ${client.gender}\n`;

  if (client.settings) {
    try {
      const settings = client.settings as any; // Assuming settings can be any object
      if (settings.fitbit) {
        markdown += `*   **Fitbit:** Connected\n`;
      }
    } catch (e) {
      console.error("Error parsing client settings:", e);
    }
  }

  return markdown;
};

export function AIChatConversation({
  llmTools,
  selectedClient,
}: {
  llmTools: ToolType[];
  selectedClient?: ClientForTrainer;
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [selectedModel, setSelectedModel] = useState<LLMType>(models[0].id);
  const [isTyping, setIsTyping] = useState(false);

  // Effect to handle selectedClient changes
  useEffect(() => {
    if (selectedClient) {
      // Clear previous messages and start a new conversation with client details
      setMessages([]);
      setInputValue("");
      setIsTyping(true);

      const clientSelectedUserMessage: ChatMessage = {
        id: nanoid(),
        content: `Client ${selectedClient.name} (${selectedClient.email}) selected.`,
        role: "user",
        timestamp: new Date(),
      };

      const loadingAssistantMessage: ChatMessage = {
        id: nanoid(),
        content: "", // Empty content for loading state
        role: "assistant",
        timestamp: new Date(),
        isStreaming: true, // Indicate loading
      };

      setMessages([clientSelectedUserMessage, loadingAssistantMessage]); // Immediately display user message and loading spinner

      const clientDetailsPrompt = `Please get details for client with ID: ${selectedClient.id}. When you have the client details, respond ONLY with the raw JSON output from the getClientDetails tool. Do NOT add any conversational text or additional formatting. The frontend will handle the display.`;

      const conversationRequest: AIConversation = {
        model: selectedModel,
        prompt: clientDetailsPrompt,
        toolList: llmTools,
        conversation: [
          {
            id: nanoid(),
            content: clientDetailsPrompt,
            type: "user",
          },
        ],
      };

      agentQuery(conversationRequest)
        .then((aiResponse) => {
          setMessages((prevMessages) => {
            const updatedMessages = [...prevMessages];
            // Find and update the loading message
            const loadingMsgIndex = updatedMessages.findIndex(
              (msg) => msg.id === loadingAssistantMessage.id
            );

            let formattedContent = aiResponse.content;
            try {
              const clientObject = JSON.parse(aiResponse.content);
              // Check if the response is likely client details from our tool
              if (clientObject && clientObject.id === selectedClient.id) {
                formattedContent = formatClientDetailsAsMarkdown(clientObject);
              }
            } catch (e) {
              // Not a JSON object, or not client details, use as is
              console.warn(
                "LLM response was not a client JSON object, or parsing failed:",
                e
              );
            }

            if (loadingMsgIndex !== -1) {
              updatedMessages[loadingMsgIndex] = {
                ...updatedMessages[loadingMsgIndex],
                content: formattedContent, // Use formatted content
                isStreaming: false,
              };
            } else {
              // Fallback if loading message not found (shouldn't happen)
              updatedMessages.push({
                id: nanoid(),
                content: formattedContent, // Use formatted content
                role: "assistant",
                timestamp: new Date(),
                isStreaming: false,
              });
            }
            return updatedMessages;
          });
        })
        .catch((error) => {
          console.error("Error fetching client details with LLM:", error);
          setMessages((prevMessages) => {
            const updatedMessages = [...prevMessages];
            const loadingMsgIndex = updatedMessages.findIndex(
              (msg) => msg.id === loadingAssistantMessage.id
            );
            if (loadingMsgIndex !== -1) {
              updatedMessages[loadingMsgIndex] = {
                ...updatedMessages[loadingMsgIndex],
                content: `Error: Could not fetch details for client ${selectedClient.name}. ${error.message}`,
                isStreaming: false,
              };
            } else {
              updatedMessages.push({
                id: nanoid(),
                content: `Error: Could not fetch details for client ${selectedClient.name}. ${error.message}`,
                role: "assistant",
                timestamp: new Date(),
                isStreaming: false,
              });
            }
            return updatedMessages;
          });
        })
        .finally(() => {
          setIsTyping(false);
        });
    } else {
      // If no client is selected, reset to initial messages
      setMessages(initialMessages);
    }
  }, [selectedClient, llmTools, selectedModel]); // Depend on selectedClient, llmTools, and selectedModel

  const handleSubmit: FormEventHandler<HTMLFormElement> = useCallback(
    async (event) => {
      event.preventDefault();

      if (!inputValue.trim() || isTyping) return;

      const userMessage: ChatMessage = {
        id: nanoid(),
        content: inputValue.trim(),
        role: "user",
        timestamp: new Date(),
      };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages); // Update state with the new array
      setInputValue("");
      setIsTyping(true);

      try {
        const conversationRequest: AIConversation = {
          model: selectedModel,
          prompt: "You are a helpful assistant.", // This can be made dynamic
          toolList: llmTools, // Pass llmTools here
          conversation: updatedMessages.map((msg) => ({
            id: msg.id,
            content: msg.content,
            type: msg.role === "user" ? "user" : "ai",
          })),
        };

        const aiResponse = await agentQuery(conversationRequest);

        const assistantMessage: ChatMessage = {
          id: nanoid(),
          content: aiResponse.content,
          role: "assistant",
          timestamp: new Date(),
          isStreaming: false, // Assuming agentQuery returns full content, not streaming
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error: any) {
        console.error("Error calling agentQuery:", error);
        setMessages((prev) => [
          ...prev,
          {
            id: nanoid(),
            content: `Error: ${error.message}`,
            role: "assistant",
            timestamp: new Date(),
            isStreaming: false,
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [inputValue, isTyping, messages, selectedModel, llmTools]
  );

  const handleReset = useCallback(() => {
    setMessages(initialMessages);
    setInputValue("");
    setIsTyping(false);
  }, []);

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
                  {message.isStreaming && message.content === "" ? (
                    <div className="flex items-center gap-2">
                      <Loader size={14} />
                      <span className="text-muted-foreground text-sm">
                        Thinking...
                      </span>
                    </div>
                  ) : message.role === "assistant" ? (
                    <Response>{message.content}</Response>
                  ) : (
                    message.content
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
            placeholder="Ask me anything lets talk fitness..."
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
    </>
  );
}
