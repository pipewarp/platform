import type { Flow, RunContext } from "@pipewarp/specs";
import type { EventEnvelope } from "@pipewarp/ports";

export interface StepHandler {
  queue(flow: Flow, context: RunContext, stepName: string): Promise<void>;

  onWorkerDone(
    flow: Flow,
    context: RunContext,
    event: EventEnvelope
  ): Promise<void>;
}
