import type { Flow, RunContext } from "@pipewarp/specs";
import type { AnyEvent } from "@pipewarp/types";
import { StepEmitter } from "@pipewarp/events";

export interface StepHandler {
  queue(
    flow: Flow,
    context: RunContext,
    stepName: string,
    emitter: StepEmitter
  ): Promise<void>;

  onWorkerDone(flow: Flow, context: RunContext, event: AnyEvent): Promise<void>;
}
