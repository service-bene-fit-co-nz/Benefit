import { tool } from "ai";
import { z } from "zod";
import { ToolMetadata } from "@/utils/ai/ai-types";
import { format } from "date-fns";

const getCurrentDateAndTimeTool = tool({
  description: `
    Returns the current date and time in ISO 8601 format.
    `,
  inputSchema: z.object({}),
  execute: async () => {
    try {
      const currentDateAndTime = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSXXX");
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
    description: getCurrentDateAndTimeTool.description,
    tool: getCurrentDateAndTimeTool,
  },
];
