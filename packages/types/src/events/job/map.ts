import type {
  DomainEntityActionDescriptor,
  DomainActionDescriptor,
} from "../shared/otel-attributes.js";
import {
  JobCompletedData,
  JobFailedData,
  JobHttpJsonData,
  JobMcpQueuedData,
  JobStartedData,
  JobQueuedData,
} from "./data.js";

export type JobEventMap = {
  "job.mcp.queued": DomainEntityActionDescriptor<
    "job",
    "mcp",
    "queued",
    JobMcpQueuedData
  >;
  "job.httpjson.requested": DomainEntityActionDescriptor<
    "job",
    "httpjson",
    "requested",
    JobHttpJsonData
  >;
  "job.started": DomainActionDescriptor<"job", "started", JobStartedData>;
  "job.completed": DomainActionDescriptor<"job", "completed", JobCompletedData>;
  "job.failed": DomainActionDescriptor<"job", "failed", JobFailedData>;
  "job.queued": DomainActionDescriptor<"job", "queued", JobQueuedData>;
};

export type JobEventType = keyof JobEventMap;

export type JobEventData<T extends JobEventType> = JobEventMap[T]["data"];
export type JobDataFor<T extends JobRequestedType> = JobEventMap[T]["data"];
export type JobOtelAttributesMap = {
  [T in JobEventType]: Omit<JobEventMap[T], "data">;
};

export type JobRequestedType = Extract<JobEventType, `${string}.requested`>;
