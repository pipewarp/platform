import type {
  ToolClass,
  ToolClassFor,
  ToolFactories,
  ToolId,
} from "./tool-factory.js";

export class ToolRegistry {
  #toolObjects = new Map<string, ToolClassFor<ToolId>>();
  constructor(private readonly toolFactories: ToolFactories) {}

  get<T extends ToolId>(
    toolId: T,
    contextKey?: string
  ): ToolClassFor<T> | undefined {
    const key = contextKey ? `${toolId}:${contextKey}` : toolId;
    return this.#toolObjects.get(key);
  }

  resolve(toolId: ToolId, contextKey?: string) {
    const key = contextKey ? `${toolId}:${contextKey}` : toolId;
    let tool = this.#toolObjects.get(toolId);
    // make an instance only if we dont already have it
    if (!tool) {
      const factory = this.toolFactories[toolId];
      if (!factory) {
        throw new Error(`[tool-registry] no factory for ${toolId}`);
      }
      tool = factory();
      this.#toolObjects.set(key, tool);
    }
    return tool;
  }

  list(): ToolClass[] {
    return Array.from(this.#toolObjects.values());
  }
}
