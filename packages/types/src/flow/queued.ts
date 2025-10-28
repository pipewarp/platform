import type { FlowEvent } from "../shared/flow-event.js";
export type FlowQueuedData = {
  flowName: string;
  inputs: Record<string, unknown>;
  test?: boolean;
  outfile: string;
};

export type FlowQueuedEvent = FlowEvent<"flow.queued">;
