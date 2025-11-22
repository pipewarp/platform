import { StepHttpJson } from "../../flow/http-json.step.js";
import { PipeData } from "../shared/pipe.js";

export type JobDescriptor = {
  job: {
    id: string;
    capability: string;
  };
};

export type JobMcpQueuedData = JobDescriptor & {
  url: string;
  transport: "sse" | "stdio" | "streamable-http" | "http";
  feature: {
    primitive:
      | "resource"
      | "prompt"
      | "tool"
      | "sampling"
      | "roots"
      | "elicitation";
    name: string;
  };
  args?: Record<string, unknown>;
  pipe: PipeData;
};

export type JobHttpJsonData = JobDescriptor &
  Omit<StepHttpJson, "pipe"> & {
    pipe: PipeData;
  };

export type JobStartedData = JobDescriptor & {
  status: "started";
};

export type JobCompletedData = JobDescriptor & {
  status: "completed";
  result?: unknown;
};

export type JobFailedData = JobDescriptor & {
  status: "failed";
  result?: unknown;
  reason: string;
};

export type JobQueuedData = JobDescriptor & {
  status: "queued";
};

// job.http:json.queued
// job.
