import { Tool } from "ai";
import {
  getClientDetailsTool,
  getClientNotesTool,
  getCurrentDateAndTimeTool,
  getRawFitbitDataTool,
  getAllClientsTool,
  getClientIdByNameTool,
  saveClientNoteTool,
} from "./tools/client/client";
import {
  getCurrentClientDetailsTool,
  getCurrentClientFacebookMessagesTool,
} from "./tools/currentClient/currentClient";
import { sqlQueryTool } from "./tools/db/prisma";

export type ToolType =
  | "currentClient.details.get"
  | "currentClient.facebook.messages.get"
  | "allClients.details.get"
  | "allClients.notes.get"
  | "allClients.notes.save"
  | "allClients.rawFitbitData.get"
  | "allClients.allClients.get"
  | "allClients.idByName.get"
  | "db.sqlQuery.get"
  | "utility.currentDateTime.get";

// Define a recursive type for the nested tool map
type NestedToolMap = {
  [key: string]: unknown;
};

// The toolFunctionMap needs to be a nested object
const toolFunctionMap: NestedToolMap = {
  currentClient: {
    details: {
      get: getCurrentClientDetailsTool,
    },
    facebook: {
      messages: {
        get: getCurrentClientFacebookMessagesTool,
      },
    },
  },
  allClients: {
    details: {
      get: getClientDetailsTool,
    },
    notes: {
      get: getClientNotesTool,
      save: saveClientNoteTool,
    },
    rawFitbitData: {
      get: getRawFitbitDataTool,
    },
    allClients: {
      get: getAllClientsTool,
    },
    idByName: {
      get: getClientIdByNameTool,
    },
  },
  db: {
    sqlQuery: {
      get: sqlQueryTool,
    },
  },
  utility: {
    currentDateTime: {
      get: getCurrentDateAndTimeTool,
    },
  },
};

const toolNameMap: Record<ToolType, string> = {
  "currentClient.details.get": "getCurrentClientDetails",
  "currentClient.facebook.messages.get": "getCurrentClientFacebookMessages",
  "allClients.details.get": "getClientDetails",
  "allClients.notes.get": "getClientNotes",
  "allClients.notes.save": "saveClientNote",
  "allClients.rawFitbitData.get": "getRawFitbitData",
  "allClients.allClients.get": "getAllClients",
  "allClients.idByName.get": "getClientIdByName",
  "db.sqlQuery.get": "sqlQuery",
  "utility.currentDateTime.get": "getCurrentDateAndTime",
};

export const getTool = (type: ToolType): Tool => {
  const parts = type.split(".");
  let currentLevel: unknown = toolFunctionMap;

  for (const part of parts) {
    if (
      typeof currentLevel === "object" &&
      currentLevel !== null &&
      part in currentLevel
    ) {
      currentLevel = (currentLevel as Record<string, unknown>)[part];
    } else {
      throw new Error(
        `Tool of type "${type}" not found. Path segment "${part}" is missing.`
      );
    }
  }

  // A valid tool is an object with an 'execute' property.
  if (
    typeof currentLevel === "object" &&
    currentLevel !== null &&
    "execute" in currentLevel
  ) {
    return currentLevel as Tool;
  } else {
    console.error(
      `*** Get Tool Failed: The path for "${type}" did not resolve to a valid tool object.`
    );
    throw new Error(`Resolved item for "${type}" is not a valid tool.`);
  }
};

export const getTools = (types: ToolType[]): { [key: string]: Tool } => {
  const tools: { [key: string]: Tool } = {};
  for (const type of types) {
    const tool = getTool(type);
    const toolName = toolNameMap[type];
    if (tool && toolName) {
      tools[toolName] = tool;
    }
  }
  return tools;
};
