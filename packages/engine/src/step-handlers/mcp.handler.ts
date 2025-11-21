import type { StepHandler } from "./step-handler.js";
import type { ResolveStepArgs } from "../resolve.js";
import type { AnyEvent, JobMcpQueuedData } from "@lcase/types";
import type { RunContext, Flow, McpStep } from "@lcase/specs";
import type { JobEmitter } from "@lcase/events";
import { PipeResolver } from "../pipe-resolver.js";

export class McpStepHandler implements StepHandler {
  constructor(
    private readonly resolveArgs: ResolveStepArgs,
    private readonly pipeResolver: PipeResolver
  ) {}

  async queue(
    flow: Flow,
    context: RunContext,
    stepName: string,
    emitter: JobEmitter
  ): Promise<void> {
    const step: McpStep = flow.steps[stepName] as McpStep;

    const args = step.args ? this.resolveArgs(context, step.args) : undefined;

    const pipes = this.pipeResolver.resolve(flow, context, stepName);
    try {
      let args = flow.steps[stepName].args;
      if (args !== undefined) {
        args = this.resolveArgs(context, args);
      }

      // making data here just to log it
      const data: JobMcpQueuedData = {
        job: {
          id: String(crypto.randomUUID()),
          capability: step.type,
        },
        args,
        pipe: pipes,
        url: step.url,
        transport: step.transport,
        feature: step.feature,
      };

      await emitter.emit("job.mcp.queued", data);

      emitter.emit("job.httpjson.requested", {
        job: {
          id: "",
          capability: "",
        },
        url: "",
        type: "httpjson",
        pipe: {
          to: undefined,
          from: undefined,
        },
      });
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
