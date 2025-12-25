// tools/clientTools.ts

import { z } from "zod";
import { tool } from "ai";
import { fetchClientById } from "@/server-actions/trainer/clients/actions";
import {
  fetchClientNotes,
  createClientNote,
} from "@/server-actions/client/notes/actions";
import { ClientNoteType } from "@prisma/client";
import { findClientByName } from "@/server-actions/client/actions";
import { readAllClients } from "@/server-actions/admin/clients/actions";
import { fetchRawFitbitDatabyDate } from "@/server-actions/fitbit/actions";
import { ToolMetadata } from "@/utils/ai/ai-types";

// --- Input Schema Definition ---
// Define a single Zod schema that can be reused for both tools
const ClientIdInputSchema = z.object({
  clientId: z.string().describe("The unique ID of the client."),
});

// ------------------------------------
// 1. getClientDetails Tool (Fixed)
// ------------------------------------
const getClientDetailsTool = tool({
  // Improved description focuses on the function, not the required format
  description:
    "Fetches comprehensive details (name, status, email, etc.) of a client using their unique client ID.",

  // Pass the Zod schema directly
  inputSchema: ClientIdInputSchema,

  // The execute function now receives a typed object argument (DO NOT parse JSON)
  execute: async ({ clientId }: z.infer<typeof ClientIdInputSchema>) => {
    try {
      const client = await fetchClientById(clientId);

      if (!client) {
        return {
          status: "not_found",
          message: `Client with ID ${clientId} not found.`,
        };
      }

      return { description: "Client Details", ...client };
    } catch (error: unknown) {
      // Return a structured error object
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

// ------------------------------------
// 2. getClientNotes Tool (Fixed)
// ------------------------------------
const getClientNotesTool = tool({
  description:
    "Fetches all historical notes and progress entries associated with a client using their unique client ID.",

  // Reuse the defined Zod schema
  inputSchema: ClientIdInputSchema,

  // The execute function now correctly receives a typed object
  execute: async ({ clientId }: z.infer<typeof ClientIdInputSchema>) => {
    try {
      // Ensure fetchClientNotes is awaited if it returns a Promise (which is typical for server actions)
      const notes = await fetchClientNotes(clientId);

      if (!notes || (Array.isArray(notes) && notes.length === 0)) {
        return {
          status: "no_notes",
          message: `No notes found for client with ID ${clientId}.`,
        };
      }

      // Return the result object directly (DO NOT stringify)
      return notes;
    } catch (error: unknown) {
      // Return a structured error object
      console.error("Error fetching client notes:", error);
      return {
        error:
          error instanceof Error
            ? error.message
            : "An unknown error occurred during client notes fetch.",
      };
    }
  },
});

// --- New Input Schema ---
const ClientNameInputSchema = z.object({
  firstName: z.string().optional().describe("The first name of the client."),
  lastName: z.string().optional().describe("The last name of the client."),
});

// ------------------------------------
// 3. getClientIdByName Tool
// ------------------------------------
const getClientIdByNameTool = tool({
  description: "Finds a client's ID by their first name, last name, or both.",
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

// ------------------------------------
// 4. getAllClients Tool
// ------------------------------------
const getAllClientsTool = tool({
  description: "Gets all clients with their IDs, first names, and last names.",
  inputSchema: ClientNameInputSchema,
  execute: async ({
    firstName,
    lastName,
  }: z.infer<typeof ClientNameInputSchema>) => {
    try {
      const result = await readAllClients();

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

// --- New Input Schema ---
const FitbitDataInputSchema = z.object({
  clientId: z.string().describe("The unique ID of the client."),
  startDate: z.string().describe("The start date in YYYY-MM-DD format."),
  endDate: z.string().describe("The end date in YYYY-MM-DD format."),
});

// ------------------------------------
// 5. getRawFitbitData Tool
// ------------------------------------
const getRawFitbitDataTool = tool({
  description:
    "Fetches raw Fitbit data for a client within a specified date range.",
  inputSchema: FitbitDataInputSchema,
  execute: async ({
    clientId,
    startDate,
    endDate,
  }: z.infer<typeof FitbitDataInputSchema>) => {
    try {
      const result = await fetchRawFitbitDatabyDate(
        clientId,
        new Date(startDate),
        new Date(endDate)
      );

      if (!result.success) {
        return {
          error: result.message,
        };
      }

      if (result.data && result.data.length === 0) {
        return {
          status: "not_found",
          message: "No Fitbit data found for the specified date range.",
        };
      }

      return result.data;
    } catch (error: unknown) {
      console.error("Error fetching raw Fitbit data:", error);
      return {
        error:
          error instanceof Error
            ? error.message
            : "An unknown error occurred while fetching raw Fitbit data.",
      };
    }
  },
});

// --- New Input Schema for ClientNote ---
const SaveClientNoteInputSchema = z.object({
  clientId: z.string().describe("The unique ID of the client."),
  noteType: z.nativeEnum(ClientNoteType).describe("The type of the note."),
  noteMetadata: z
    .record(z.string(), z.any())
    .describe(
      "A JSON object for metadata. The LLM must confirm this with the user before saving."
    ),
  formData: z
    .record(z.string(), z.any())
    .describe(
      "A JSON object for form data. The LLM must confirm this with the user before saving."
    ),
});

// ------------------------------------
// 6. saveClientNote Tool
// ------------------------------------
const saveClientNoteTool = tool({
  description: `Saves a new note for a client. The LLM should always confirm the data for noteMetadata and formData with the user before proceeding. Only trainer notes can be stored using
    this function.
    noteMetaData field should include a title field and and author as part of the json
    formData field should include the note test in a json parameter called content
    Before committing the data to to the database always display the data that wil be stored in the db and ask if it is correct before saving
    `,
  inputSchema: SaveClientNoteInputSchema,
  execute: async ({
    clientId,
    noteType,
    noteMetadata,
    formData,
  }: z.infer<typeof SaveClientNoteInputSchema>) => {
    try {
      const newNote = await createClientNote(
        clientId,
        noteType,
        noteMetadata,
        formData
      );

      return {
        status: "success",
        message: "Client note saved successfully.",
        noteId: newNote.id,
      };
    } catch (error: unknown) {
      console.error("Error saving client note:", error);
      return {
        error:
          error instanceof Error
            ? error.message
            : "An unknown error occurred while saving the client note.",
      };
    }
  },
});


export const clientTools: ToolMetadata[] = [
  {
    toolType: "allClients.details.get",
    description: getClientDetailsTool.description,
    tool: getClientDetailsTool,
  },
  {
    toolType: "allClients.notes.get",
    description: getClientNotesTool.description,
    tool: getClientNotesTool,
  },
  {
    toolType: "allClients.idByName.get",
    description: getClientIdByNameTool.description,
    tool: getClientIdByNameTool,
  },
  {
    toolType: "allClients.allClients.get",
    description: getAllClientsTool.description,
    tool: getAllClientsTool,
  },
  {
    toolType: "allClients.rawFitbitData.get",
    description: getRawFitbitDataTool.description,
    tool: getRawFitbitDataTool,
  },
  {
    toolType: "allClients.notes.save",
    description: saveClientNoteTool.description,
    tool: saveClientNoteTool,
  },
];
