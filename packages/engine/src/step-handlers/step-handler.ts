import type { Flow, RunContext } from "@lcase/specs";
import type { AnyEvent } from "@lcase/types";
import { JobEmitter } from "@lcase/events";

export interface StepHandler {
  queue(
    flow: Flow,
    context: RunContext,
    stepName: string,
    emitter: JobEmitter
  ): Promise<void>;

  onWorkerDone(flow: Flow, context: RunContext, event: AnyEvent): Promise<void>;
}
