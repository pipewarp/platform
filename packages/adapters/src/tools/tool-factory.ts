import { McpTool } from "./mcp.tool.js";

export interface ToolMap {
  mcp: McpTool;
}

export interface ToolFactoryMap {
  mcp: () => McpTool;
}

export type ToolFactory = ToolFactoryMap[keyof ToolFactoryMap];
export type ToolId = keyof ToolFactoryMap;
export type ToolClassFor<T extends ToolId> = ToolMap[T];
export type ToolClass = ToolMap[keyof ToolMap];

export type ToolFactories = Record<ToolId, ToolFactory>;
