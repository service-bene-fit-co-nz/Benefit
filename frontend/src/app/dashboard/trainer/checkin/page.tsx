"use client";

import React, { useState } from "react";
import { AdaptiveFilterLayout } from "@/components/layout/AdaptiveFilterLayout";
import { SummaryFilterPanel } from "@/components/dashboard/trainer/summary/SummaryFilterPanel";
import { ClientManagementPanel } from "@/components/dashboard/trainer/summary/ClientManagementPanel";
import { ClientForTrainer } from "@/server-actions/trainer/clients/actions";
import { AIChatConversation } from "@/components/ai/v2/AIChatConversation";
import { ToolType } from "@/utils/ai/toolManager/toolManager";
import { getClientDetails, getClientNotes } from "@/utils/ai/toolManager/tools/client/client";

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

  const llmTools: ToolType[] = ["client.details.get", "client.notes.get"];

  return (
    <div className="h-full">
      <AdaptiveFilterLayout
        Header={<></>}
        MainContent={
          <div className="flex h-[calc(100vh-4rem)] w-full flex-col overflow-hidden border bg-background shadow-sm">
            <AIChatConversation llmTools={llmTools} selectedClient={selectedClient} />
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
