import { randomUUID } from "crypto";
import type { StepHandler } from "./step-handler.js";
import type { ResolveStepArgs } from "../resolve.js";
import type { EventBusPort, StepCompletedEvent } from "@pipewarp/ports";
import type {
  EventData,
  AnyEvent,
  StepActionQueuedData,
} from "@pipewarp/types";
import type { RunContext, ActionStep, Flow } from "@pipewarp/specs";
import { StepEmitter } from "@pipewarp/events";
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

    // const data: EventData<"step.action.queued"> = {
    //   tool: step.tool,
    //   op: step.op,
    //   ...(args !== undefined ? { args } : {}),
    //   pipe: {},
    // };
    const pipes = this.pipeResolver.resolve(flow, context, stepName);
    try {
      // if (pipes.to?.id !== undefined) data.pipe.to = pipes.to;
      // if (pipes.from?.id !== undefined) data.pipe.from = pipes.from;
      // console.log("DATA:", JSON.stringify(data, null, 2));

      const emitter = new StepEmitter("step.action.queued", this.bus, {
        correlationId: context.correlationId,
        flowId: context.flowName,
        runId: context.runId,
        stepId: stepName,
        source: "engine/action-step-handler",
        stepType: "action",
      });

      let args = flow.steps[stepName].args;
      if (args !== undefined) {
        args = this.resolveArgs(context, args);
      }

      const data: StepActionQueuedData = {
        tool: flow.steps[stepName].tool,
        op: flow.steps[stepName].op,
        args,
        pipe: pipes,
      };
      console.log("data", JSON.stringify(data, null, 2));
      await emitter.emit(data);
      context.steps[stepName].status = "queued";
    } catch (err) {
      console.error(
        `[action-step-handler] emitting step ${stepName} in flow ${flow.name}`
      );
      console.error(err);
    }

    // this.bus.publish("steps.lifecycle", event);
  }

  onWorkerDone(
    flow: Flow,
    context: RunContext,
    event: StepCompletedEvent
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
