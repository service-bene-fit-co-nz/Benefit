import { DynamicTool } from "@langchain/core/tools";
import { z } from "zod";
import { fetchClientById } from "@/server-actions/trainer/clients/actions";
import { fetchClientNotes } from "@/server-actions/client/notes/actions";

export const getClientDetails = new DynamicTool({
  name: "getClientDetails",
  description: "Use this tool to get the details of a client by their ID. The input should be a JSON string with a 'clientId' property, e.g., '{\"clientId\": \"some-client-id\"}'.",
  func: async (input: string) => {
    try {
      const parsedInput = JSON.parse(input);
      const { clientId } = z.object({ clientId: z.string() }).parse(parsedInput);
      const client = await fetchClientById(clientId);
      return JSON.stringify(client);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return JSON.stringify({ error: error.message });
      }
      return JSON.stringify({ error: "An unknown error occurred." });
    }
  },
});

export const getClientNotes = new DynamicTool({
  name: "getClientNotes",
  description: "Use this tool to get the notes for a client by their ID. The input should be a JSON string with a 'clientId' property, e.g., '{\"clientId\": \"some-client-id\"}'.",
  func: async (input: string) => {
    try {
      const parsedInput = JSON.parse(input);
      const { clientId } = z.object({ clientId: z.string() }).parse(parsedInput);
      const notes = await fetchClientNotes(clientId);
      return JSON.stringify(notes);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return JSON.stringify({ error: error.message });
      }
      return JSON.stringify({ error: "An unknown error occurred." });
    }
  },
});