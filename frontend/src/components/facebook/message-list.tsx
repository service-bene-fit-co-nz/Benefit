import { FlatMessage } from "@/server-actions/facebook/types";
import { MessageCard } from "./message";

export interface MessageListProps {
  messages: FlatMessage[];
}

const MessageList = ({ messages }: MessageListProps) => {
  return (
    <div className="flex flex-1 flex-col">
      <div className="grid gap-y-4">
        {messages.map((message) => (
          <MessageCard key={message.message_id} message={message} />
        ))}
      </div>
    </div>
  );
};

export default MessageList;
