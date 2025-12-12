export const dynamic = "force-dynamic";

import MessageList from "@/components/facebook/message-list";
import { downloadMessengerHistory } from "@/server-actions/facebook/actions";
import { FlatMessage } from "@/server-actions/facebook/types";

export default async function MessagesPage() {
  let messages: FlatMessage[] = [];
  let error: string | null = null;

  try {
    const result = await downloadMessengerHistory();

    if (result.success) {
      messages = result.data;
    } else {
      error = result.error || "Failed to fetch messages.";
      console.error("Failed to fetch messages:", result.error);
    }
  } catch (err: any) {
    console.error("Error fetching messages:", err);
    error =
      err.message || "An unexpected error occurred while loading messages.";
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4 text-center">
        <div className="text-lg text-red-600">Could Not Load Messages</div>
        <div className="mt-2 text-sm text-gray-600 max-w-md">{error}</div>
        <p className="mt-4 text-xs text-gray-500">
          There might be an issue with the Facebook integration or environment
          variables.
        </p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="text-lg text-gray-600">No messages found.</div>
        <p className="mt-2 text-sm text-gray-500">
          There are no recent messages to display.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Messages</h1>
      </div>
      <div className="bg-muted/50 rounded-xl">
        <MessageList messages={messages} />
      </div>
    </div>
  );
}
