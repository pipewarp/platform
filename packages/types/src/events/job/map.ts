import type {
  DomainEntityActionDescriptor,
  DomainActionDescriptor,
} from "../event-map.js";
import {
  JobCompletedData,
  JobFailedData,
  JobMcpQueuedData,
  JobStartedData,
} from "./data.js";

export type JobEventMap = {
  "job.mcp.queued": DomainEntityActionDescriptor<
    "job",
    "mcp",
    "queued",
    JobMcpQueuedData
  >;
  "job.started": DomainActionDescriptor<"job", "started", JobStartedData>;
  "job.completed": DomainActionDescriptor<"job", "completed", JobCompletedData>;
  "job.failed": DomainActionDescriptor<"job", "failed", JobFailedData>;
};

export type JobEventType = keyof JobEventMap;

export type JobEventData<T extends JobEventType> = JobEventMap[T]["data"];
export type JobOtelAttributesMap = {
  [T in JobEventType]: Omit<JobEventMap[T], "data">;
};
