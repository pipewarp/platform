import type { ToolId } from "@lcase/tools";

export type JobDescription = {
  id: string;
  isProducer: boolean;
  isConsumer: boolean;
  streamId?: string;
  capability: ToolId;
  key?: string;
  data: unknown;
};
// created for each dequeued job; lives until job completes or fails
export type JobContext = {
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
  description: JobDescription;
  resolved: {
    // resolved dependencies (input files, tokens, session handles)
  };
};
