import React from "react";
import { AIChatConversation } from "@/components/ai/AIChatConversation";
import { ToolType } from "@/utils/ai/vercel/toolManager/toolManager";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const TrainerAIPage = async () => {
  const session = await getServerSession(authOptions);
  const authId = session?.user?.id;
  const llmTools: ToolType[] = [
    "utility.currentDateTime.get",
    "allClients.rawFitbitData.get",
  ];

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full flex-col overflow-hidden border bg-background shadow-sm">
      <AIChatConversation
        llmTools={llmTools}
        hasTrainerPrompt={false}
        authId={authId}
      />
    </div>
  );
};

export default TrainerAIPage;
