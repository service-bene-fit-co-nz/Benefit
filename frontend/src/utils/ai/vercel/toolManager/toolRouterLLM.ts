// src/utils/ai/vercel/agent/toolRouterLLM.ts
import { ToolType, getTools } from "./toolManager";
import { getLLM } from "@/utils/ai-utils";
import { HumanMessage } from "@langchain/core/messages";
import { Tool } from "ai";

const toolDescriptions: Partial<Record<ToolType, string>> = {
  "currentClient.details.get":
    "Gets all client details and records from multiple tables in the database for a client based on the currently logged in user.",
  "currentClient.facebook.messages.get":
    "Gets all facebook messages for a client based on a facebook id.",
  "allClients.details.get":
    "Fetches comprehensive details (name, status, email, etc.) of a client using their unique client ID.",
  "allClients.notes.get":
    "Fetches all historical notes and progress entries associated with a client using their unique client ID.",
  "allClients.notes.save":
    "Saves a new note for a client. The LLM should always confirm the data for noteMetadata and formData with the user before proceeding. Only trainer notes can be stored using this function.",
  "allClients.rawFitbitData.get":
    "Fetches raw Fitbit data for a client within a specified date range.",
  "allClients.allClients.get":
    "Gets all clients with their IDs, first names, and last names.",
  "allClients.idByName.get":
    "Finds a client's ID by their first name, last name, or both.",
  "db.sqlQuery.get":
    "Executes a read-only SQL SELECT query against the Postgres database. Use this ONLY to retrieve data for the user.",
  "utility.currentDateTime.get":
    "Returns the current date and time in ISO 8601 format.",
};

export const getRelevantToolsLLM = async (
  message: string,
  availableToolTypes: ToolType[]
): Promise<{ [key: string]: Tool }> => {
  if (!message) return {};

  const llm = getLLM("Gemini-2.5-flash"); // Using a fast model for this routing task

  const toolsWithDescriptions = availableToolTypes
    .map((toolType) => {
      const description = toolDescriptions[toolType];
      if (description) {
        return `  - "${toolType}": "${description}"`;
      }
      return null;
    })
    .filter(Boolean)
    .join("\n");

  const prompt = `
    Given the user's message, identify the most relevant tools to use from the following list. 
    
    User Message: "${message}" 
    
    Available Tools:
    {
    ${toolsWithDescriptions}
    }
    
    Return a JSON array of strings, where each string is the name of a relevant tool. For example: ["tool1.name.get", "tool2.name.get"].
    If no tools are relevant, return an empty array.
    `;

  const response = await llm.invoke([new HumanMessage(prompt)]);

  try {
    const responseText = response.content.toString();
    const startIndex = responseText.indexOf("[");
    const endIndex = responseText.lastIndexOf("]");
    if (startIndex !== -1 && endIndex !== -1) {
      const jsonString = responseText.substring(startIndex, endIndex + 1);
      const toolNames = JSON.parse(jsonString);

      // Filter to ensure only available tools are returned
      const relevantToolTypes = toolNames.filter((tool: any) =>
        availableToolTypes.includes(tool)
      );
      return getTools(relevantToolTypes);
    }
    return {};
  } catch (error) {
    console.error("Error parsing LLM response for tool routing:", error);
    return {};
  }
};
