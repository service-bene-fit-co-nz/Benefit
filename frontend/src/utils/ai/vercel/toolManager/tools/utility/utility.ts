import { tool } from "ai";
import { z } from "zod";
import { ToolMetadata } from "@/utils/ai/ai-types";

const getCurrentDateAndTimeTool = tool({
  description: `
    Returns the current date and time in ISO 8601 format.
    `,
  inputSchema: z.object({}),
  execute: async () => {
    try {
      const currentDateAndTime = new Date().toISOString();
      return {
        status: "success",
        dateAndTime: currentDateAndTime,
      };
    } catch (error: unknown) {
      console.error("Error getting current date and time:", error);
      return {
        error:
          error instanceof Error
            ? error.message
            : "An unknown error occurred while getting the current date and time.",
      };
    }
  },
});

export const utilityTools: ToolMetadata[] = [
  {
    toolType: "utility.currentDateTime.get",
    functionName: "getCurrentDateAndTime",
    description: getCurrentDateAndTimeTool.description,
    tool: getCurrentDateAndTimeTool,
  },
];
