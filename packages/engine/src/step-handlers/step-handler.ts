import type { Flow, RunContext } from "@pipewarp/specs";
import type { EventEnvelope } from "@pipewarp/ports";
import { StepEmitter } from "@pipewarp/events";

export interface StepHandler {
  queue(
    flow: Flow,
    context: RunContext,
    stepName: string,
    emitter: StepEmitter<"step.action.queued">
  ): Promise<void>;

  onWorkerDone(
    flow: Flow,
    context: RunContext,
    event: EventEnvelope
  ): Promise<void>;
}
