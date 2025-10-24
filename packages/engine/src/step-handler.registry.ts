import { ActionStepHandler } from "./step-handlers/action.handler.js";
import type { EventBusPort } from "@pipewarp/ports";
import type { ResolveStepArgs } from "./resolve.js";
import { PipeResolver } from "./pipe-resolver.js";

export type StepHandlerRegistry = {
  action: ActionStepHandler;
};

export function wireStepHandlers(
  bus: EventBusPort,
  argResolver: ResolveStepArgs,
  pipeResolver: PipeResolver
): StepHandlerRegistry {
  const stepHandlers = {
    action: new ActionStepHandler(bus, argResolver, pipeResolver),
  };
  return stepHandlers;
}
