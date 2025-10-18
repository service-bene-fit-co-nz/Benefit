import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Combobox } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import {
  fetchPrompts as serverFetchPrompts,
  PromptData,
} from "@/server-actions/admin/prompts/actions";
import { AIChatWrapper } from "@/components/ai/AIChatWrapper";

interface ClientForTrainer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  avatarUrl?: string;
  gender?: string;
}

interface ClientManagementPanelProps {
  contextBadges: string[];
  selectedClient?: ClientForTrainer;
}

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
};

export const ClientManagementPanel: React.FC<ClientManagementPanelProps> = ({
  contextBadges,
  selectedClient,
}) => {
  const [prompts, setPrompts] = useState<PromptData[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    const loadPrompts = async () => {
      try {
        const fetchedPrompts = await serverFetchPrompts();
        setPrompts(fetchedPrompts);
      } catch (error) {
        console.error("Error fetching prompts:", error);
      }
    };
    loadPrompts();
  }, []);

  const promptOptions = prompts.map((p) => ({ label: p.title, value: p.id }));

  return (
    <div className="flex flex-col h-full">
      {selectedClient ? (
        <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg mb-4">
          <Avatar className="h-16 w-16">
            <AvatarImage
              src={selectedClient.avatarUrl}
              alt={selectedClient.name}
            />
            <AvatarFallback>{selectedClient.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-xl font-bold">{selectedClient.name}</h3>
            <p className="text-sm text-muted-foreground">
              DOB: {formatDate(selectedClient.dateOfBirth)}
            </p>
            <p className="text-sm text-muted-foreground">
              Gender: {selectedClient.gender || "N/A"}
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-muted rounded-lg mb-4 text-center text-muted-foreground">
          <p>
            Please select a client from the Summary Filter Panel to view their
            details.
          </p>
        </div>
      )}

      <div
        className={`flex flex-wrap gap-2 mb-4 ${
          contextBadges.length > 0 ? "border border-dashed p-4 rounded-md" : ""
        }`}
      >
        {contextBadges.length > 0
          ? contextBadges.map((badgeText, index) => (
              <Badge key={index} variant="secondary">
                {badgeText}
              </Badge>
            ))
          : selectedClient && (
              <p className="text-sm text-gray-500 border border-dashed p-4 rounded-md w-full text-center">
                Add context from the client context panel...
              </p>
            )}
      </div>
      {selectedClient && (
        <div className="mb-4">
          <Combobox
            options={promptOptions}
            value={selectedPromptId}
            onValueChange={setSelectedPromptId}
            placeholder="Select a fitness persona..."
            className="w-full"
          />
        </div>
      )}
      {selectedClient && (
        <div className="flex-grow">
          <AIChatWrapper />
        </div>
      )}
    </div>
  );
};
