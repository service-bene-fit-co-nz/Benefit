// src/utils/ai/vercel/agent/toolRouterLLM.ts
import { getTools } from "./toolManager";
import { ToolType, toolDescriptions } from "../../types";
import { getLLM } from "@/utils/ai-utils";
import { HumanMessage } from "@langchain/core/messages";
import { Tool } from "ai";

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
