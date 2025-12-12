import { FlatMessage } from "@/server-actions/facebook/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export interface MessageCardProps {
  message: FlatMessage;
}

export function MessageCard({ message }: MessageCardProps) {
  // Find the first audio attachment, if any.
  const audioAttachment = message.raw_message_data?.attachments?.data?.find(
    (att: any) => att.mime_type && att.mime_type.startsWith("audio/")
  );

  // Find other non-audio attachments for display purposes.
  const otherAttachments = message.raw_message_data?.attachments?.data?.filter(
    (att: any) => !att.mime_type || !att.mime_type.startsWith("audio/")
  );

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-start space-x-8 pb-2">
        <Avatar>
          <AvatarImage
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${message.sender_name}`}
            alt={message.sender_name}
          />
          <AvatarFallback>{message.sender_name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 flex flex-col sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-2">
          <div className="flex flex-col flex-shrink-0">
            <CardTitle className="text-base font-semibold">
              {message.sender_name}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {format(new Date(message.timestamp), "MMM dd, yyyy HH:mm:ss")}
            </p>
          </div>
          {(message.message_text || message.has_attachments) && (
            <p className="text-sm mt-1 sm:mt-0 sm:flex-1 min-w-0">
              {message.message_text ||
                (message.has_attachments ? (
                  <em>Message with attachment(s)</em>
                ) : (
                  <em>Empty message</em>
                ))}
            </p>
          )}
        </div>
      </CardHeader>
      {audioAttachment && (
        <CardContent className="pt-0 pb-2 px-4">
          <div className="mt-3">
            <audio controls src={audioAttachment.file_url} className="w-full">
              Your browser does not support the audio element.
            </audio>
          </div>
        </CardContent>
      )}
      {/* <CardContent className="pt-0 pb-2 px-4">
        {audioAttachment && (
          <div className="mt-3">
            <audio controls src={audioAttachment.file_url} className="w-full">
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
      </CardContent> */}
    </Card>
  );
}
