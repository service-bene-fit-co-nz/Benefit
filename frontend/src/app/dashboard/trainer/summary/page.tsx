"use client";

import { AdaptiveFilterLayout } from "@/components/layout/AdaptiveFilterLayout";
import { SummaryFilterPanel } from "@/components/dashboard/trainer/summary/SummaryFilterPanel";
import { ClientManagementPanel } from "@/components/dashboard/trainer/summary/ClientManagementPanel";

const ClientManagementHeader = () => (
  <h1 className="text-2xl font-bold">Client Management</h1>
);

export default function SummaryPage() {
  return (
    <div className="h-screen">
      <AdaptiveFilterLayout
        Header={<ClientManagementHeader />}
        MainContent={<ClientManagementPanel />}
        FilterPanel={<SummaryFilterPanel />}
      />
    </div>
  );
}
