import type { ZodSchema } from "zod";
import type { EventType } from "@lcase/types";
import {
  FlowCompletedSchema,
  FlowQueuedSchema,
  FlowStartedSchema,
} from "./schemas/flow-event.schema.js";
import {
  FlowCompletedDataSchema,
  FlowQueuedDataSchema,
  FlowStartedDataSchema,
} from "./schemas/flow-data.schema.js";
import {
  EngineStartedSchema,
  EngineStoppedSchema,
} from "./schemas/engine.event.schema.js";
import {
  EngineStartedDataSchema,
  EngineStoppedDataSchema,
} from "./schemas/engine.data.schema.js";
import {
  RunCompletedSchema,
  RunStartedSchema,
} from "./schemas/run.event.schema.js";
import {
  RunCompletedDataSchema,
  RunStartedDataSchema,
} from "./schemas/run.data.schema.js";
import {
  StepCompletedSchema,
  StepStartedSchema,
} from "./schemas/step.event.schema.js";
import {
  StepCompletedDataSchema,
  StepStartedDataSchema,
} from "./schemas/step.data.schema.js";
import {
  JobCompletedSchema,
  JobFailedSchema,
  JobHttpJsonRequested,
  JobMcpQueuedSchema,
  JobQueuedSchema,
  JobStartedSchema,
} from "./schemas/job.event.schema.js";
import {
  JobCompletedDataSchema,
  JobFailedDataSchema,
  JobHttpJsonRequestedData,
  JobMcpQueuedDataSchema,
  JobQueuedDataSchema,
  JobStartedDataSchema,
} from "./schemas/job.data.schema.js";
import {
  ToolCompletedSchema,
  ToolFailedSchema,
  ToolStartedSchema,
} from "./schemas/tool.event.schema.js";
import {
  ToolCompletedDataSchema,
  ToolFailedDataSchema,
  ToolStartedDataSchema,
} from "./schemas/tool.data.schema.js";
import {
  WorkerRegisteredDataSchema,
  WorkerRegistrationRequestedDataSchema,
  WorkerStartedDataSchema,
  WorkerStoppedDataSchema,
} from "./schemas/worker.data.schema.js";
import {
  WorkerRegisteredSchema,
  WorkerRegistrationRequestedSchema,
  WorkerStartedSchema,
  WorkerStoppedSchema,
} from "./schemas/worker.event.schema.js";
import { SystemLoggedSchema } from "./schemas/system.event.schema.js";
import { SystemLoggedDataSchema } from "./schemas/system.data.schema.js";

export type EventTopic =
  | "steps.lifecycle"
  | "flows.lifecycle"
  | "workers.lifecycle"
  | "engines.lifecycle"
  | "runs.lifecycle"
  | "jobs.lifecycle"
  | "tools.lifecycle"
  | "system";

// simple hardcoded registry mapping event types to schemas, as well as
// topics to publish the event to
export const registry = {
  "flow.queued": {
    topic: "flows.lifecycle",
    schema: {
      event: FlowQueuedSchema,
      data: FlowQueuedDataSchema,
    },
  },
  "flow.started": {
    topic: "flows.lifecycle",
    schema: {
      event: FlowStartedSchema,
      data: FlowStartedDataSchema,
    },
  },
  "flow.completed": {
    topic: "flows.lifecycle",
    schema: {
      event: FlowCompletedSchema,
      data: FlowCompletedDataSchema,
    },
  },
  "engine.started": {
    topic: "engines.lifecycle",
    schema: {
      event: EngineStartedSchema,
      data: EngineStartedDataSchema,
    },
  },
  "engine.stopped": {
    topic: "engines.lifecycle",
    schema: {
      event: EngineStoppedSchema,
      data: EngineStoppedDataSchema,
    },
  },
  "run.started": {
    topic: "runs.lifecycle",
    schema: {
      event: RunStartedSchema,
      data: RunStartedDataSchema,
    },
  },
  "run.completed": {
    topic: "runs.lifecycle",
    schema: {
      event: RunCompletedSchema,
      data: RunCompletedDataSchema,
    },
  },
  "step.started": {
    topic: "steps.lifecycle",
    schema: {
      event: StepStartedSchema,
      data: StepStartedDataSchema,
    },
  },
  "step.completed": {
    topic: "steps.lifecycle",
    schema: {
      event: StepCompletedSchema,
      data: StepCompletedDataSchema,
    },
  },
  "step.failed": {
    topic: "steps.lifecycle",
    schema: {
      event: StepCompletedSchema,
      data: StepCompletedDataSchema,
    },
  },
  "job.mcp.queued": {
    topic: "jobs.lifecycle",
    schema: {
      event: JobMcpQueuedSchema,
      data: JobMcpQueuedDataSchema,
    },
  },
  "job.queued": {
    topic: "jobs.lifecycle",
    schema: {
      data: JobQueuedDataSchema,
      event: JobQueuedSchema,
    },
  },
  "job.started": {
    topic: "jobs.lifecycle",
    schema: {
      event: JobStartedSchema,
      data: JobStartedDataSchema,
    },
  },
  "job.completed": {
    topic: "jobs.lifecycle",
    schema: {
      event: JobCompletedSchema,
      data: JobCompletedDataSchema,
    },
  },
  "job.failed": {
    topic: "jobs.lifecycle",
    schema: {
      event: JobFailedSchema,
      data: JobFailedDataSchema,
    },
  },
  "job.httpjson.requested": {
    topic: "jobs.lifecycle",
    schema: {
      event: JobHttpJsonRequested,
      data: JobHttpJsonRequestedData,
    },
  },
  "tool.started": {
    topic: "tools.lifecycle",
    schema: {
      event: ToolStartedSchema,
      data: ToolStartedDataSchema,
    },
  },
  "tool.completed": {
    topic: "tools.lifecycle",
    schema: {
      event: ToolCompletedSchema,
      data: ToolCompletedDataSchema,
    },
  },
  "tool.failed": {
    topic: "tools.lifecycle",
    schema: {
      event: ToolFailedSchema,
      data: ToolFailedDataSchema,
    },
  },
  "worker.started": {
    topic: "workers.lifecycle",
    schema: {
      event: WorkerStartedSchema,
      data: WorkerStartedDataSchema,
    },
  },
  "worker.stopped": {
    topic: "workers.lifecycle",
    schema: {
      event: WorkerStoppedSchema,
      data: WorkerStoppedDataSchema,
    },
  },
  "worker.registered": {
    topic: "workers.lifecycle",
    schema: {
      event: WorkerRegisteredSchema,
      data: WorkerRegisteredDataSchema,
    },
  },
  "worker.registration.requested": {
    topic: "workers.lifecycle",
    schema: {
      event: WorkerRegistrationRequestedSchema,
      data: WorkerRegistrationRequestedDataSchema,
    },
  },
  "system.logged": {
    topic: "system",
    schema: {
      event: SystemLoggedSchema,
      data: SystemLoggedDataSchema,
    },
  },
} satisfies Record<
  EventType,
  { topic: EventTopic; schema: { event: ZodSchema; data: ZodSchema } }
>;
