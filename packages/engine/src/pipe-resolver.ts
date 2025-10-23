import { StreamRegistryPort } from "@pipewarp/ports";
import type { ActionStep, Flow, RunContext } from "@pipewarp/specs";
import { randomUUID } from "crypto";

export type ResolvedPipes = {
  from?: string;
  to?: string;
};

export class PipeResolver {
  constructor(private readonly streamRegistry: StreamRegistryPort) {}

  resolve(flow: Flow, context: RunContext, stepName: string): ResolvedPipes {
    const step = flow.steps[stepName] as ActionStep;
    if (step === undefined) {
      throw new Error(`[pipe-resolver] no step with name ${stepName}`);
    }

    const pipes: ResolvedPipes = {};

    if (step.pipe?.to) {
      const { id } = this.streamRegistry.createStream(randomUUID());
      pipes.to = id;
      context.steps[stepName].pipes = { to: id };
      pipes.to = id;
    }
    if (step.pipe?.from) {
      const fromStep = step.pipe.from;
      const id = context.steps[fromStep].pipes?.to;
      if (id === undefined) {
        throw new Error(`[pipe-resolver] cannot setup stream - no from id;`);
      }
      console.log(`[pipe-resolver] stepName ${stepName}; id${id}`);
      pipes.from = id;
      context.steps[stepName].pipes = { from: id };
      pipes.from = id;
    }
    return pipes;
  }
}
