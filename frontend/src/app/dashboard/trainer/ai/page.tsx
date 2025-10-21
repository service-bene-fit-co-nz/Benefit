import React from "react";
import { AIChatConversation } from "@/components/ai/v2/AIChatConversation";
import { ToolType } from "@/utils/ai/toolManager/toolManager";

const TrainerAIPage = () => {
  const llmTools: ToolType[] = []; // Define LLM tools as an empty array for this page

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full flex-col overflow-hidden border bg-background shadow-sm">
      <AIChatConversation llmTools={llmTools} />
    </div>
  );
};

export default TrainerAIPage;
