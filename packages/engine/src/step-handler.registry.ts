import { ActionStepHandler } from "./step-handlers/action.handler.js";
import type { EventBusPort } from "@pipewarp/ports";
import type { ResolveStepArgs } from "./resolve.js";
import { PipeResolver } from "./pipe-resolver.js";
import { McpStepHandler } from "./step-handlers/mcp.handler.js";

export type StepHandlerRegistry = {
  action: ActionStepHandler;
  mcp: McpStepHandler;
};

export function wireStepHandlers(
  bus: EventBusPort,
  argResolver: ResolveStepArgs,
  pipeResolver: PipeResolver
): StepHandlerRegistry {
  const stepHandlers = {
    action: new ActionStepHandler(bus, argResolver, pipeResolver),
    mcp: new McpStepHandler(bus, argResolver, pipeResolver),
  };
  return stepHandlers;
}
