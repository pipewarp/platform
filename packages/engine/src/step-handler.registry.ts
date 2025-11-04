import { ActionStepHandler } from "./step-handlers/action.handler.js";
import type { ResolveStepArgs } from "./resolve.js";
import { PipeResolver } from "./pipe-resolver.js";
import { McpStepHandler } from "./step-handlers/mcp.handler.js";

export type StepHandlerRegistry = {
  action: ActionStepHandler;
  mcp: McpStepHandler;
};

export function wireStepHandlers(
  argResolver: ResolveStepArgs,
  pipeResolver: PipeResolver
): StepHandlerRegistry {
  const stepHandlers = {
    action: new ActionStepHandler(argResolver, pipeResolver),
    mcp: new McpStepHandler(argResolver, pipeResolver),
  };
  return stepHandlers;
}
