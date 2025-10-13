"use client";

import { AdaptiveFilterLayout } from "@/components/layout/AdaptiveFilterLayout";
import SummaryFilterPanel from "@/components/dashboard/trainer/summary/SummaryFilterPanel";

const ExampleHeader = () => (
  <h1 className="text-2xl font-bold">Example Page</h1>
);

const ExampleMainContent = () => (
  <div>
    <p>This is the main content area. It will scroll if the content is long.</p>
    {Array.from({ length: 10 }).map((_, i) => (
      <p key={i}>Scrollable content line {i + 1}</p>
    ))}
  </div>
);

export default function SummaryPage() {
  return (
    <div className="h-screen">
      <AdaptiveFilterLayout
        Header={<ExampleHeader />}
        MainContent={<ExampleMainContent />}
        FilterPanel={<SummaryFilterPanel />}
      />
    </div>
  );
}
