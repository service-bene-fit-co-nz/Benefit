import { FlatMessage } from "@/server-actions/facebook/types";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

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
      <CardHeader className="flex flex-row items-center space-x-4 pb-2">
        <Avatar>
          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${message.sender_name}`} alt={message.sender_name} />
          <AvatarFallback>{message.sender_name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle className="text-base font-semibold">{message.sender_name}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {format(new Date(message.timestamp), 'MMM dd, yyyy HH:mm:ss')}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm">
          {message.message_text || (message.has_attachments ? <em>Message with attachment(s)</em> : <em>Empty message</em>)}
        </p>
        {audioAttachment && (
          <div className="mt-3">
            <audio controls src={audioAttachment.file_url} className="w-full">
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
      </CardContent>
      {message.has_attachments && (
        <CardFooter className="flex-wrap gap-2">
          {audioAttachment && (
            <Badge variant="secondary">Audio Clip</Badge>
          )}
          {otherAttachments && otherAttachments.map((att: any) => (
             <Badge key={att.id} variant="outline">{att.mime_type || 'Attachment'}</Badge>
          ))}
        </CardFooter>
      )}
    </Card>
  );
}
