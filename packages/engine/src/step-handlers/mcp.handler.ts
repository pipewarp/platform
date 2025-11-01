import type { StepHandler } from "./step-handler.js";
import type { ResolveStepArgs } from "../resolve.js";
import type { EventBusPort } from "@pipewarp/ports";
import type { AnyEvent, StepMcpQueuedData } from "@pipewarp/types";
import type { RunContext, Flow, McpStep } from "@pipewarp/specs";
import { StepEmitter } from "@pipewarp/events";
import { PipeResolver } from "../pipe-resolver.js";

export class McpStepHandler implements StepHandler {
  constructor(
    private readonly bus: EventBusPort,
    private readonly resolveArgs: ResolveStepArgs,
    private readonly pipeResolver: PipeResolver
  ) {}

  async queue(
    flow: Flow,
    context: RunContext,
    stepName: string,
    emitter: StepEmitter
  ): Promise<void> {
    const step: McpStep = flow.steps[stepName] as McpStep;

    const args = step.args ? this.resolveArgs(context, step.args) : undefined;

    const pipes = this.pipeResolver.resolve(flow, context, stepName);
    try {
      let args = flow.steps[stepName].args;
      if (args !== undefined) {
        args = this.resolveArgs(context, args);
      }

      const data: StepMcpQueuedData = {
        args,
        pipe: pipes,
        url: step.url,
        transport: step.transport,
        feature: step.feature,
      };
      console.log("data", JSON.stringify(data, null, 2));
      await emitter.emit(data);
      context.steps[stepName].status = "queued";
    } catch (err) {
      console.error(
        `[mcp-step-handler] emitting step ${stepName} in flow ${flow.name}`
      );
      console.error(err);
    }
  }

  onWorkerDone(
    flow: Flow,
    context: RunContext,
    event: AnyEvent
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
