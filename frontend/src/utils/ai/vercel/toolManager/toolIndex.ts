import { ToolMetadata, ToolIdentifier } from "../../ai-types";
import { clientTools } from "./tools/client/client";
import { currentClientTools } from "./tools/currentClient/currentClient";
import { dbTools } from "./tools/db/prisma";
import { utilityTools } from "./tools/utility/utility";

const allTools: ToolMetadata[] = [
  ...clientTools,
  ...currentClientTools,
  ...dbTools,
  ...utilityTools,
];

export const toolMetadata: Record<
  ToolIdentifier,
  { functionName: string; description?: string }
> = allTools.reduce((acc, currentTool) => {
  acc[currentTool.toolType] = {
    functionName: currentTool.functionName,
    description: currentTool.description,
  };
  return acc;
}, {} as Record<ToolIdentifier, { functionName: string; description?: string }>);

export const allVercelAITools = allTools.reduce((acc, currentTool) => {
  acc[currentTool.toolType] = currentTool;
  return acc;
}, {} as Record<ToolIdentifier, ToolMetadata>);

export const getToolMetadata = (toolType: ToolIdentifier) => {
  return allVercelAITools[toolType];
};
