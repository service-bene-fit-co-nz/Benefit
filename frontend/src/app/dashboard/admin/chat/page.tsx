// Force dynamic rendering
export const dynamic = "force-dynamic";

import { listChatSpaces, readChatMessages } from "@/server-actions/chat/actions";
import { Spaces, Messages } from "googleapis/build/src/apis/chat/v1";

export default async function ChatPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const spaceId = searchParams?.spaceId as string | undefined;

  let spaces: Spaces[] = [];
  let messages: Messages[] = [];
  let error: string | null = null;
  let spacesError: string | null = null;

  try {
    const spacesResult = await listChatSpaces();
    if (spacesResult.success) {
      spaces = spacesResult.data;
    } else {
      spacesError = spacesResult.message || "Failed to fetch chat spaces.";
    }

    if (spaceId) {
      const messagesResult = await readChatMessages(spaceId);
      if (messagesResult.success) {
        messages = messagesResult.data;
      } else {
        error = messagesResult.message || `Failed to fetch messages for space ${spaceId}.`;
      }
    } else if (spaces.length > 0) {
      // automatically load messages from the first space
      const firstSpaceId = spaces[0].name;
      if (firstSpaceId) {
        const messagesResult = await readChatMessages(firstSpaceId);
        if (messagesResult.success) {
          messages = messagesResult.data;
        } else {
          error = messagesResult.message || `Failed to fetch messages for space ${firstSpaceId}.`;
        }
      }
    }

  } catch (err: any) {
    error = err.message || "An unexpected error occurred.";
  }

  if (spacesError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="text-lg text-red-600">Could not load Google Chat</div>
        <div className="mt-2 text-sm text-gray-600 max-w-md text-center">{spacesError}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-1">
      <aside className="w-1/4 bg-gray-100 p-4">
        <h2 className="text-lg font-semibold mb-4">Chat Spaces</h2>
        <ul>
          {spaces.map((space) => (
            <li key={space.name} className="mb-2">
              <a href={`/dashboard/admin/chat?spaceId=${space.name}`} className="text-blue-600 hover:underline">
                {space.displayName}
              </a>
            </li>
          ))}
        </ul>
      </aside>
      <main className="flex-1 p-4">
        <h1 className="text-2xl font-bold mb-4">Chat Messages</h1>
        {error && <div className="text-red-500">{error}</div>}
        <div className="space-y-4">
          {messages.length > 0 ? (
            messages.map((message) => (
              <div key={message.name} className="p-4 border rounded-lg">
                <div className="font-bold">{message.sender?.displayName}</div>
                <div>{message.text}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {message.createTime ? new Date(message.createTime).toLocaleString() : ''}
                </div>
              </div>
            ))
          ) : (
            <p>No messages found or no space selected.</p>
          )}
        </div>
      </main>
    </div>
  );
}
