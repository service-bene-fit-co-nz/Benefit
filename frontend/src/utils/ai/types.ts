export type LLMType =
  | "Gemini-2.5-flash"
  | "Gemini-2.5-flash-lite"
  | "ChatGPT"
  | "Groq";

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

export const toolNameMap: Record<ToolType, string> = {
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

export const toolDescriptions: Partial<Record<ToolType, string>> = {
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
