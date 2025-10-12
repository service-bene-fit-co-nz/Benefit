"use client";

import { AdaptiveFilterLayout } from "@/components/layout/AdaptiveFilterLayout";

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

const ExampleFilterPanel = () => (
  <div>
    <h2 className="text-lg font-semibold mb-4">Filters</h2>
    <p>This is the filter panel. It will also scroll if the content is long.</p>
    {Array.from({ length: 10 }).map((_, i) => (
      <div key={i} className="p-2 border-b">
        Filter item {i + 1}
      </div>
    ))}
  </div>
);

export default function SummaryPage() {
  return (
    <div className="h-screen">
      <AdaptiveFilterLayout
        Header={<ExampleHeader />}
        MainContent={<ExampleMainContent />}
        FilterPanel={<ExampleFilterPanel />}
      />
    </div>
  );
}
