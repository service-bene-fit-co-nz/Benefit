import React from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ClientForTrainer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  avatarUrl?: string;
  gender?: string;
}

interface ClientManagementPanelProps {
  contextBadges: string[];
  selectedClient?: ClientForTrainer;
}

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
};

export const ClientManagementPanel: React.FC<ClientManagementPanelProps> = ({
  contextBadges,
  selectedClient,
}) => {
  return (
    <div>
      {selectedClient ? (
        <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg mb-4">
          <Avatar className="h-16 w-16">
            <AvatarImage
              src={selectedClient.avatarUrl}
              alt={selectedClient.name}
            />
            <AvatarFallback>{selectedClient.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-xl font-bold">{selectedClient.name}</h3>
            <p className="text-sm text-muted-foreground">
              DOB: {formatDate(selectedClient.dateOfBirth)}
            </p>
            <p className="text-sm text-muted-foreground">
              Gender: {selectedClient.gender || "N/A"}
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-muted rounded-lg mb-4 text-center text-muted-foreground">
          <p>
            Please select a client from the Summary Filter Panel to view their
            details.
          </p>
        </div>
      )}

      <div className={`flex flex-wrap gap-2 mb-4 ${contextBadges.length > 0 ? 'border border-dashed p-4 rounded-md' : ''}`}>
        {contextBadges.length > 0
          ? contextBadges.map((badgeText, index) => (
              <Badge key={index} variant="secondary">
                {badgeText}
              </Badge>
            ))
          : selectedClient && (
            <p className="text-sm text-gray-500 border border-dashed p-4 rounded-md w-full text-center">
              Select filter items from the SummaryFilterPanel to add context badges.
            </p>
            )}
      </div>
    </div>
  );
};
