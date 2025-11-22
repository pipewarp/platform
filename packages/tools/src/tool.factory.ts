import { HttpJsonTool } from "./httpjson.tool.js";
import { McpTool } from "./mcp.tool.js";
import { ToolFactoryMap, ToolFactorySubset, ToolId } from "./tool.types.js";

export const toolFactoryMap: ToolFactoryMap = {
  mcp: () => new McpTool(),
  httpjson: () => new HttpJsonTool(),
} satisfies ToolFactoryMap;

/**
 * Creates custom factories for supplied tool ids.
 *
 * @param toolIds array if string tool ids ToolId[]
 * @returns ToolFactorySubset<ID> : an object with object creation methods for
 * the tools ids you supplied.
 *
 * @example
 * const factories = createToolFactories(["mcp", "httpjson"]);
 * const mcpTool = factories.mcp();
 * const httpjsonTool = factores.httpjson();
 */
export function createToolFactories<ID extends ToolId>(
  toolIds: ID[]
): ToolFactorySubset<ID> {
  const toolFactories: Partial<ToolFactorySubset<ID>> = {};

  for (const id of toolIds) {
    toolFactories[id] = toolFactoryMap[id];
  }
  return toolFactories as ToolFactorySubset<ID>;
}

const a = createToolFactories(["mcp", "httpjson"]);
