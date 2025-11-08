import type { FlowEvent } from "../shared/flow-event.js";

export type FlowDescriptor = {
  flow: {
    id: string;
    name: string;
    version: string;
  };
};

export type FlowQueuedData = FlowDescriptor & {
  flowName: string;
  inputs: Record<string, unknown>;
  test?: boolean;
  outfile: string;
};

export type FlowStartedData = FlowDescriptor & {};
export type FlowCompletedData = FlowDescriptor & {};

export type FlowQueuedEvent = FlowEvent<"flow.queued">;
