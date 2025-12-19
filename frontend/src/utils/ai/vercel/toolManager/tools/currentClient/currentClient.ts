import { z } from "zod";
import { tool } from "ai";
import { findClientByName } from "@/server-actions/client/actions";
import { downloadMessengerHistory } from "@/server-actions/facebook/actions";

// --- New Input Schema ---
const ClientNameInputSchema = z.object({
  firstName: z.string().optional().describe("The first name of the client."),
  lastName: z.string().optional().describe("The last name of the client."),
});

export const getCurrentClientDetailsTool = tool({
  description: `Gets all client details and records from multiple tables in the database for a client based on the currently logged in user.
    `,
  inputSchema: ClientNameInputSchema,
  execute: async ({
    firstName,
    lastName,
  }: z.infer<typeof ClientNameInputSchema>) => {
    try {
      const result = await findClientByName({ firstName, lastName });

      if (!result.success) {
        return {
          error: result.message,
        };
      }

      if (result.data && result.data.length === 0) {
        return {
          status: "not_found",
          message: "No clients found matching the provided name.",
        };
      }

      return result.data;
    } catch (error: unknown) {
      console.error("Error finding client by name:", error);
      return {
        error:
          error instanceof Error
            ? error.message
            : "An unknown error occurred while finding client by name.",
      };
    }
  },
});

const FacebookIdInputSchema = z.object({
  faceBookId: z.string().optional().describe("The Facebook ID of the client."),
});

export const getCurrentClientFacebookMessagesTool = tool({
  description: `Gets all facebook messages for a client based on a facebook id.
    `,
  inputSchema: FacebookIdInputSchema,
  execute: async ({ faceBookId }: z.infer<typeof FacebookIdInputSchema>) => {
    try {
      const result = await downloadMessengerHistory(
        undefined,
        undefined,
        faceBookId
      );

      if (!result.success) {
        return {
          error: result.message,
        };
      }

      if (result.data && result.data.length === 0) {
        return {
          status: "not_found",
          message: "No messages for client found.",
        };
      }

      return result.data;
    } catch (error: unknown) {
      console.error("Error finding messages:", error);
      return {
        error:
          error instanceof Error
            ? error.message
            : "An unknown error occurred while finding messages.",
      };
    }
  },
});
