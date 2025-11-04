import type { ZodSchema } from "zod";
import type { EventType } from "@pipewarp/types";
import {
  FlowQueuedSchema,
  FlowQueuedDataSchema,
  StepActionCompletedSchema,
  StepActionCompletedDataSchema,
  StepActionQueuedSchema,
  StepActionQueuedDataSchema,
  StepMcpQueuedDataSchema,
  StepMcpQueuedSchema,
} from "./events.schema.js";

export type EventTopic =
  | "steps.lifecycle"
  | "flows.lifecycle"
  | "workers.lifecycle";

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
  "step.action.completed": {
    topic: "steps.lifecycle",
    schema: {
      event: StepActionCompletedSchema,
      data: StepActionCompletedDataSchema,
    },
  },
  "step.action.queued": {
    topic: "steps.lifecycle",
    schema: {
      event: StepActionQueuedSchema,
      data: StepActionQueuedDataSchema,
    },
  },
  "step.mcp.queued": {
    topic: "steps.lifecycle",
    schema: {
      data: StepMcpQueuedDataSchema,
      event: StepMcpQueuedSchema,
    },
  },

  "worker.registered": {
    topic: "workers.lifecycle",
    schema: {
      event: {} as ZodSchema,
      data: {} as ZodSchema,
    },
  },
  "worker.registration.requested": {
    topic: "workers.lifecycle",
    schema: {
      event: {} as ZodSchema,
      data: {} as ZodSchema,
    },
  },
} satisfies Record<
  EventType,
  { topic: EventTopic; schema: { event: ZodSchema; data: ZodSchema } }
>;
