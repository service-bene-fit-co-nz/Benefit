import React from "react";
import { AIChatConversation } from "@/components/ai/AIChatConversation";
import { ToolType } from "@/utils/ai/types";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const TrainerAIPage = async () => {
  const session = await getServerSession(authOptions);
  const authId = session?.user?.id;
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
  ];
  // const llmTools: ToolType[] = [
  //   "allClients.details.get",
  //   "allClients.notes.get",
  //   "allClients.notes.save",
  //   "allClients.rawFitbitData.get",
  //   "allClients.allClients.get",
  //   "allClients.idByName.get",
  //   "db.sqlQuery.get",
  //   "utility.currentDateTime.get",
  //   "currentClient.facebook.messages.get",
  // ];

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full flex-col overflow-hidden border bg-background shadow-sm">
      <AIChatConversation
        llmTools={llmTools}
        hasTrainerPrompt={true}
        authId={authId}
      />
    </div>
  );
};

export default TrainerAIPage;
