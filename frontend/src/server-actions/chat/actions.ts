"use server";

import { google } from "googleapis";
import { getAuthenticatedChatClient } from "@/lib/chat-utils";

export async function listChatSpaces() {
  try {
    const { chat } = await getAuthenticatedChatClient();
    const response = await chat.spaces.list();
    return { success: true, data: response.data.spaces || [] };
  } catch (error: any) {
    console.error("Error fetching Google Chat spaces:", error);
    return { success: false, message: error.message };
  }
}

export async function readChatMessages(spaceName: string) {
  try {
    const { chat } = await getAuthenticatedChatClient();
    const response = await chat.spaces.messages.list({
      parent: spaceName,
    });

    return { success: true, data: response.data.messages || [] };
  } catch (error: any) {
    console.error("Error fetching Google Chat messages:", error);
    return { success: false, message: error.message };
  }
}
