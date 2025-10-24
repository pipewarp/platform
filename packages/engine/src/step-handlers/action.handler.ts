import { randomUUID } from "crypto";
import type { StepHandler } from "./step-handler.js";
import type { ResolveStepArgs } from "../resolve.js";
import type {
  EventBusPort,
  EventEnvelope,
  ActionQueuedData,
  StepCompletedEvent,
} from "@pipewarp/ports";
import type { RunContext, ActionStep, Flow } from "@pipewarp/specs";
import { PipeResolver } from "../pipe-resolver.js";

export class ActionStepHandler implements StepHandler {
  constructor(
    private readonly bus: EventBusPort,
    private readonly resolveArgs: ResolveStepArgs,
    private readonly pipeResolver: PipeResolver
  ) {}

  async queue(
    flow: Flow,
    context: RunContext,
    stepName: string
  ): Promise<void> {
    const step: ActionStep = flow.steps[stepName] as ActionStep;

    const args = step.args ? this.resolveArgs(context, step.args) : undefined;

    const data: ActionQueuedData = {
      stepName,
      stepType: step.type,
      tool: step.tool,
      op: step.op,
      ...(args !== undefined ? { args } : {}),
      pipe: {},
    };

    try {
      const pipes = this.pipeResolver.resolve(flow, context, stepName);
      if (pipes.to?.id !== undefined) data.pipe.to = pipes.to;
      if (pipes.from?.id !== undefined) data.pipe.from = pipes.from;
      console.log("DATA:", JSON.stringify(data, null, 2));
    } catch (err) {
      console.error(
        `[action-step-handler] error resolving pipes for step ${stepName} in flow ${flow.name}`
      );
      console.error(err);
    }

    const event: EventEnvelope = {
      id: randomUUID(),
      correlationId: context.correlationId,
      kind: "step.queued",
      time: new Date().toISOString(),
      runId: context.runId,
      data,
    };
    this.bus.publish("steps.lifecycle", event);
    context.steps[stepName].status = "queued";
  }

  onWorkerDone(
    flow: Flow,
    context: RunContext,
    event: StepCompletedEvent
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
