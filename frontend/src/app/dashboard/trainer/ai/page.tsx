import React from "react";
import { AIChatConversation } from "@/components/ai/v3-vercel/AIChatConversation";
import { ToolType } from "@/utils/ai/vercel/toolManager/toolManager";

const TrainerAIPage = () => {
  const llmTools: ToolType[] = [
    "allClients.details.get",
    "allClients.notes.get",
    "allClients.notes.save",
    "allClients.rawFitbitData.get",
    "allClients.allClients.get",
    "allClients.idByName.get",
    "db.sqlQuery.get",
    "utility.currentDateTime.get",
    "currentClient.facebook.messages.get",
  ]; // Define LLM tools as an empty array for this page

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full flex-col overflow-hidden border bg-background shadow-sm">
      <AIChatConversation llmTools={llmTools} hasTrainerPrompt={true} />
    </div>
  );
};

export default TrainerAIPage;
