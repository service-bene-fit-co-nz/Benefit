import { decrypt } from "./encryption";
import prisma from "@/utils/prisma/client";
import { google } from "googleapis";

/**
 * Gets a Chat client with a valid access token, refreshing if necessary
 * @returns Chat client
 */
export async function getAuthenticatedChatClient() {
  // Skip during build time
  if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL) {
    throw new Error("Chat client not available during build time");
  }

  // Get the system Google Chat configuration
  // Assuming the service name for Google Chat is 'googlechat'
  const chatService = await prisma.oAuthServices.findFirst({
    where: { name: "gmail" },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!chatService) {
    throw new Error(
      "No Google Chat configuration found. Please connect Google Chat in admin settings."
    );
  }

  const systemConfig = chatService.properties as any;

  if (!systemConfig.encryptedRefreshToken) {
    throw new Error(
      "No refresh token found. Please re-connect Google Chat in admin settings."
    );
  }

  // Validate the encrypted text format before attempting decryption
  if (!systemConfig.encryptedRefreshToken.includes(":")) {
    throw new Error(
      "Invalid encrypted refresh token format. Please re-connect Google Chat in admin settings."
    );
  }

  let refreshToken: string;
  try {
    // Decrypt the refresh token
    refreshToken = decrypt(systemConfig.encryptedRefreshToken);
  } catch (error) {
    console.error("Failed to decrypt refresh token:", error);
    throw new Error(
      "Failed to decrypt Google Chat refresh token. Please re-connect Google Chat in admin settings."
    );
  }

  // Initialize OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_GMAIL_CLIENT_ID!,
    process.env.GOOGLE_GMAIL_CLIENT_SECRET!,
    process.env.GOOGLE_GMAIL_CLIENT_REDIRECT_URI!
  );

  const expiryDate = systemConfig.expiresAt
    ? new Date(systemConfig.expiresAt).getTime()
    : undefined;

  // Set credentials
  oauth2Client.setCredentials({
    access_token: systemConfig.accessToken,
    refresh_token: refreshToken,
    expiry_date: expiryDate,
  });

  // Check if token needs refreshing
  if (expiryDate && expiryDate < Date.now()) {
    try {
      // Refresh the token
      const { credentials } = await oauth2Client.refreshAccessToken();

      // Update the database with new access token and expiry
      const newExpiresAt = credentials.expiry_date
        ? new Date(credentials.expiry_date)
        : null;

      await prisma.oAuthServices.update({
        where: { id: chatService.id },
        data: {
          properties: {
            ...systemConfig,
            accessToken: credentials.access_token!,
            expiresAt: newExpiresAt,
          },
          updatedAt: new Date(),
        },
      });

      // Also update the in-memory client
      oauth2Client.setCredentials(credentials);
    } catch (error) {
      console.error("Failed to refresh access token:", error);
      throw new Error(
        "Failed to refresh Google Chat access token. Please re-connect Google Chat in admin settings."
      );
    }
  }

  return {
    chat: google.chat({ version: "v1", auth: oauth2Client }),
  };
}
