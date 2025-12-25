import { z } from "zod";
import { tool } from "ai";
import { fetchClients } from "@/server-actions/trainer/clients/actions";
import { ToolMetadata } from "@/utils/ai/ai-types";

// ------------------------------------
// getClientDetails Tool
// ------------------------------------
const ClientDetailsInputSchema = z.object({
  clientId: z.string().optional().describe("The unique ID of the client."),
  email: z.string().optional().describe("Email of the client."),
  firstName: z.string().optional().describe("First name of the client."),
  lastName: z.string().optional().describe("Last name of the client."),
});

const getClientDetailsTool = tool({
  description: `Fetches client details (name, status, email, etc.) using client id, email or name.
    STRATEGY: If the user mentions a name, email, or ID, call this tool IMMEDIATELY. 
    DO NOT ask for missing fields (like last name or email) before searching. 
    Only ask for clarification if the search returns multiple people or no results.
    If the user asks for client details then show a basic summary of the client's or clients' information.
    `,
  inputSchema: ClientDetailsInputSchema,
  execute: async ({
    clientId,
    email,
    firstName,
    lastName,
  }: z.infer<typeof ClientDetailsInputSchema>) => {
    try {
      const client = await fetchClients({
        clientId,
        email,
        firstName,
        lastName,
      });

      if (!client) {
        return {
          status: "not_found",
          message: `Client with ID ${clientId} not found.`,
        };
      }

      return { description: "Client Details", ...client };
    } catch (error: unknown) {
      console.error("Error fetching client details:", error);
      return {
        error:
          error instanceof Error
            ? error.message
            : "An unknown error occurred during client details fetch.",
      };
    }
  },
});

export const clientTools: ToolMetadata[] = [
  {
    toolType: "clients.details.get",
    description: getClientDetailsTool.description,
    tool: getClientDetailsTool,
  },
];
