import React from "react";
import { AIChatConversation } from "@/components/ai/v2/AIChatConversation";

const TrainerAIPage = () => {
  return (
    <div className="flex h-[calc(100vh-4rem)] w-full flex-col overflow-hidden border bg-background shadow-sm">
      <AIChatConversation />
    </div>
  );
};

export default TrainerAIPage;
