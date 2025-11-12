import type { Flow, RunContext } from "@pipewarp/specs";
import type { AnyEvent } from "@pipewarp/types";
import { JobEmitter } from "@pipewarp/events";

export interface StepHandler {
  queue(
    flow: Flow,
    context: RunContext,
    stepName: string,
    emitter: JobEmitter
  ): Promise<void>;

  onWorkerDone(flow: Flow, context: RunContext, event: AnyEvent): Promise<void>;
}
