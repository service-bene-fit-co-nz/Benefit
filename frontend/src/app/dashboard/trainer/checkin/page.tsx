"use client";

import React, { useState } from "react";
import { AdaptiveFilterLayout } from "@/components/layout/AdaptiveFilterLayout";
import { SummaryFilterPanel } from "@/components/dashboard/trainer/summary/SummaryFilterPanel";
import { ClientManagementPanel } from "@/components/dashboard/trainer/summary/ClientManagementPanel";
import { ClientForTrainer } from "@/server-actions/trainer/clients/actions";
import { AIChatConversation } from "@/components/ai/AIChatConversation";
import { ToolType } from "@/utils/ai/types";

export default function CheckIn() {
  const [selectedClient, setSelectedClient] = useState<
    ClientForTrainer | undefined
  >(undefined);

  const onClientSelect = (client: ClientForTrainer | undefined) => {
    setSelectedClient(client);
  };

  const clearClientSelection = () => {
    setSelectedClient(undefined);
  };

  const llmTools: ToolType[] = [
    "allClients.details.get",
    "allClients.notes.get",
    "utility.currentDateTime.get",
  ];

  return (
    <div className="h-full">
      <AdaptiveFilterLayout
        Header={<></>}
        MainContent={
          <div className="flex h-[calc(100vh-4rem)] w-full flex-col overflow-hidden border bg-background shadow-sm">
            <AIChatConversation
              llmTools={llmTools}
              hasTrainerPrompt={true}
              authId={selectedClient?.id}
            />
          </div>
        }
        FilterPanel={
          <SummaryFilterPanel
            onClientSelect={onClientSelect}
            clearClientSelection={clearClientSelection}
          />
        }
      />
    </div>
  );
}
