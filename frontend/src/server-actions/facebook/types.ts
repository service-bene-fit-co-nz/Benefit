// Data Interfaces for Type Safety

export interface FacebookConversation {
  id: string;
  updated_time?: string;
  messages: {
    data: {
      id: string;
      created_time: string;
      message?: string;
      from: { id: string; name?: string };
      to: { data: { id: string }[] };
      attachments?: any;
    }[];
    paging?: any;
  };
}

// Interface for the simplified, flattened data
export interface FlatMessage {
  conversation_id: string;
  message_id: string;
  timestamp: string;
  sender_id: string;
  sender_name: string;
  recipient_id: string;
  message_text: string;
  has_attachments: boolean;
  // Keeping all data ensures completeness
  raw_message_data: any;
}
