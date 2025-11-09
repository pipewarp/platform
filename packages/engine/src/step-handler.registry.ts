import type { ResolveStepArgs } from "./resolve.js";
import { PipeResolver } from "./pipe-resolver.js";
import { McpStepHandler } from "./step-handlers/mcp.handler.js";

export type StepHandlerRegistry = {
  mcp: McpStepHandler;
};

export function wireStepHandlers(
  argResolver: ResolveStepArgs,
  pipeResolver: PipeResolver
): StepHandlerRegistry {
  const stepHandlers = {
    mcp: new McpStepHandler(argResolver, pipeResolver),
  };
  return stepHandlers;
}
