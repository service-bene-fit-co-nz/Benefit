"use client";

import React, { useState } from "react";
import { AdaptiveFilterLayout } from "@/components/layout/AdaptiveFilterLayout";
import { SummaryFilterPanel } from "@/components/dashboard/trainer/summary/SummaryFilterPanel";
import { ClientManagementPanel } from "@/components/dashboard/trainer/summary/ClientManagementPanel";
import { ClientForTrainer } from "@/server-actions/trainer/clients/actions";

const ClientManagementHeader = () => (
  <h1 className="text-2xl font-bold">Client Management</h1>
);

export default function SummaryPage() {
  const [contextBadges, setContextBadges] = useState<string[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientForTrainer | undefined>(undefined);

  const addBadge = (badgeText: string) => {
    setContextBadges((prevBadges) => {
      if (!prevBadges.includes(badgeText)) {
        return [...prevBadges, badgeText];
      }
      return prevBadges;
    });
  };

  const onClientSelect = (client: ClientForTrainer | undefined) => {
    setSelectedClient(client);
    setContextBadges([]); // Clear badges when a new client is selected
  };

  const clearClientSelection = () => {
    setSelectedClient(undefined);
  };

  return (
    <div className="h-full">
      <AdaptiveFilterLayout
        Header={<ClientManagementHeader />}
        MainContent={<ClientManagementPanel contextBadges={contextBadges} selectedClient={selectedClient} />}
        FilterPanel={<SummaryFilterPanel onClientSelect={onClientSelect} clearClientSelection={clearClientSelection} />}
      />
    </div>
  );
}
