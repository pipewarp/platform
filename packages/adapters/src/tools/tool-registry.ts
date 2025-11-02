import type {
  ToolClass,
  ToolClassFor,
  ToolFactories,
  ToolId,
} from "./tool-factory.js";

export class ToolRegistry {
  #toolObjects = new Map<ToolId, ToolClassFor<ToolId>>();
  constructor(private readonly toolFactories: ToolFactories) {}

  get<T extends ToolId>(tool: T): ToolClassFor<T> | undefined {
    return this.#toolObjects.get(tool);
  }

  resolve(toolId: ToolId) {
    let tool = this.#toolObjects.get(toolId);
    // make an instance only if we dont already have it
    if (!tool) {
      const factory = this.toolFactories[toolId];
      if (!factory) {
        throw new Error(`[tool-registry] no factory for ${toolId}`);
      }
      tool = factory();
      this.#toolObjects.set(toolId, tool);
    }
    return tool;
  }

  list(): ToolClass[] {
    return Array.from(this.#toolObjects.values());
  }
}
