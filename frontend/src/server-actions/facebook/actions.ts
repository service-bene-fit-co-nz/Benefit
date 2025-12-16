"use server";

import { ActionResult } from "@/types/server-action-results";
import { FlatMessage, FacebookConversation } from "./types";

/**
 * Fetches Facebook Messenger conversation history and returns it as a flat array of messages.
 * This action replaces the functionality of the /api/facebook/messenger/download route.
 * @returns {Promise<ActionResult<FlatMessage[]>>} A promise that resolves to an object containing either the message data or an error.
 */
export async function downloadMessengerHistory(
  startDate?: Date,
  endDate?: Date
): Promise<ActionResult<FlatMessage[]>> {
  // --- Configuration ---
  // These environment variables must be defined in your .env.local file
  const PAGE_ID = process.env.FACEBOOK_PAGE_ID;
  const ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const API_VERSION = process.env.FACEBOOK_API_VERSION || "v20.0";

  if (!PAGE_ID || !ACCESS_TOKEN) {
    console.error(
      "Missing Facebook environment variables (PAGE_ID or ACCESS_TOKEN)."
    );
    return {
      success: false,
      message: "Server configuration error: Missing Facebook credentials.",
    };
  }

  // Fields for Field Expansion: retrieves message details nested under conversations
  const MESSAGE_FIELDS =
    "messages{id,created_time,from,message,attachments,to}";
  const INITIAL_API_URL = `https://graph.facebook.com/${API_VERSION}/${PAGE_ID}/conversations?fields=${MESSAGE_FIELDS}&platform=messenger&access_token=${ACCESS_TOKEN}`;

  let allMessages: FlatMessage[] = [];
  let nextUrl: string | undefined = INITIAL_API_URL;

  try {
    // 1. Fetch Conversations and Messages with Pagination
    while (nextUrl) {
      const response = await fetch(nextUrl);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Facebook API Error (${response.status}): ${errorText}`);
        return {
          success: false,
          message: `Facebook API Error (${response.status}): ${errorText}`,
        };
      }

      const result: {
        data: FacebookConversation[];
        paging?: { next: string };
      } = await response.json();

      // 2. Process and Flatten Data
      result.data.forEach((conversation) => {
        const messageData = conversation.messages?.data;

        if (messageData && messageData.length > 0) {
          messageData.forEach((msg) => {
            // Determine the recipient ID (the one that is not the sender)
            const recipient = msg.to.data.find((p) => p.id !== msg.from.id);

            allMessages.push({
              conversation_id: conversation.id,
              message_id: msg.id,
              timestamp: msg.created_time,
              sender_id: msg.from.id,
              sender_name: msg.from.name || "User",
              recipient_id: recipient ? recipient.id : PAGE_ID!,
              message_text: msg.message || "",
              has_attachments: !!msg.attachments,
              raw_message_data: msg, // Include raw data for full context
            });
          });
        }
      });

      // Set up for the next page of conversations
      nextUrl = result.paging?.next;
    }

    if (allMessages.length === 0) {
      return {
        success: false,
        message: "No messages found in recent conversations.",
      };
    }

    // 3. Apply date filters if provided
    let filteredMessages = allMessages;
    if (startDate) {
      filteredMessages = filteredMessages.filter(
        (msg) => new Date(msg.timestamp) >= startDate
      );
    }
    if (endDate) {
      filteredMessages = filteredMessages.filter(
        (msg) => new Date(msg.timestamp) <= endDate
      );
    }

    // 4. Return the data
    return { success: true, data: filteredMessages };
  } catch (error) {
    console.error("Download Action Error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "An unknown error occurred.",
    };
  }
}
