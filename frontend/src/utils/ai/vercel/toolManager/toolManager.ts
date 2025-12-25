import { Tool } from "ai";
import { ToolIdentifier } from "../../ai-types";
import { allVercelAITools, getToolMetadata } from "./toolIndex";

export const getTool = (type: ToolIdentifier): Tool => {
  const toolMetadata = getToolMetadata(type);
  if (!toolMetadata) {
    throw new Error(`Tool of type "${type}" not found.`);
  }
  return toolMetadata.tool;
};

export const getTools = (types: ToolIdentifier[]): { [key: string]: Tool } => {
  const tools: { [key: string]: Tool } = {};
  for (const type of types) {
    const toolMetadata = allVercelAITools[type];
    if (toolMetadata && toolMetadata.tool) {
      tools[toolMetadata.toolType] = toolMetadata.tool;
    } else {
      console.warn(`Tool "${type}" or its metadata is incomplete/not found.`);
    }
  }
  return tools;
};
