import { tool } from "ai";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import { ToolMetadata } from "@/utils/ai/ai-types";

const prisma = new PrismaClient();

export async function executePrismaSql(query: string): Promise<any> {
  // Use $queryRawUnsafe for dynamic execution based on the LLM's output.
  try {
    // The query must be executed as a string.
    const result = await prisma.$queryRawUnsafe(query);
    // Return the result as a stringified JSON for the LLM to process
    return JSON.stringify(result, null, 2);
  } catch (error) {
    console.error("Prisma SQL Execution Error:", error);
    // Return a clear error message to the LLM
    return `SQL ERROR: ${
      error instanceof Error ? error.message : "Unknown error"
    }`;
  }
}

export function getPrismaSchemaContext(): string {
  try {
    const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
    const schemaContent = fs.readFileSync(schemaPath, "utf-8");

    // Simple regex to extract model definitions (e.g., table names and fields)
    const modelMatches =
      schemaContent.match(/model\s+(\w+)\s+\{([\s\S]*?)\}/g) || [];

    let context = "Prisma Database Schema:\n";

    modelMatches.forEach((match) => {
      const tableName = match.match(/model\s+(\w+)/)?.[1] || "UnknownTable";
      const columns = (match.match(/(\w+)\s+(\w+)/g) || [])
        .map((line) => {
          const [name, type] = line.trim().split(/\s+/);
          // Format as 'columnName (DataType)'
          return `${name} (${type})`;
        })
        .join(", ");

      context += `Table: ${tableName} (Columns: ${columns})\n`;
    });

    return context.trim();
  } catch (e) {
    console.error("Could not read schema.prisma:", e);
    return "Schema context is unavailable.";
  }
}

const sqlQueryTool = tool({
  // The description the LLM reads to decide whether to call the tool
  description: `Executes a read-only SQL SELECT query against the Postgres database. 
    Use this ONLY to retrieve data for the user. Never use INSERT, UPDATE, DELETE, or DROP.
    Note on Case Sensitivity: When querying table names that contain uppercase letters 
    (e.g., ClientTransaction), you must enclose the table name in double quotes 
    (e.g., SELECT * FROM \"ClientTransaction\";) to ensure the query is executed 
    correctly against the PostgreSQL database. Failure to do so may result in a 
    'relation does not exist' error.`,
  inputSchema: z.object({
    sqlQuery: z.string().describe("The SELECT SQL query to execute."),
  }),

  // --- This is the completed execute function ---
  execute: async ({ sqlQuery }) => {
    // --- 🚨 SECURITY GUARDRAIL ---
    // Enforce read-only policy by checking the query start
    const safeQuery = sqlQuery.trim().toLowerCase();

    if (
      safeQuery.startsWith("insert") ||
      safeQuery.startsWith("update") ||
      safeQuery.startsWith("delete") ||
      safeQuery.startsWith("drop") ||
      safeQuery.startsWith("alter")
    ) {
      // Return a security violation error to the LLM, preventing database execution
      return "SECURITY VIOLATION: Only read-only SELECT queries are permitted by this tool. Do not try to modify data.";
    }
    // ----------------------------

    // Execute the safe query using your Prisma utility
    return executePrismaSql(sqlQuery);
  },
});

export const dbTools: ToolMetadata[] = [
  {
    toolType: "db.sqlQuery.get",
    functionName: "sqlQuery",
    description: sqlQueryTool.description,
    tool: sqlQueryTool,
  },
];
