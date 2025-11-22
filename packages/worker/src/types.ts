import type { JobEventData, JobEventType } from "@lcase/types";
import type { ToolId } from "@lcase/tools";

export type JobDescriptor<T extends JobEventType> = {
  id: string;
  isProducer: boolean;
  isConsumer: boolean;
  streamId?: string;
  capability: ToolId;
  key?: string;
  data: JobEventData<T>;
};

// created for each dequeued job; lives until job completes or fails
export type JobContext<T extends JobEventType> = {
  id: string;
  capability: ToolId;
  tool: string;
  status: "preparing" | "running";
  startedAt: string;
  metadata: {
    flowId: string;
    runId: string;
    stepId: string;
    stepType: string;
    workerId: string;
  };
  description: JobDescriptor<T>;
  resolved: {
    // resolved dependencies (input files, tokens, session handles)
  };
};
