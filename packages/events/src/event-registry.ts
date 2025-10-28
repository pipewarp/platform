import type { ZodSchema } from "zod";
import type { EventType } from "@pipewarp/types";
import {
  FlowQueuedSchema,
  FlowQueuedDataSchema,
  StepActionCompletedSchema,
  StepActionCompletedDataSchema,
  StepActionQueuedSchema,
  StepActionQueuedDataSchema,
} from "./events.schema.js";

export type EventTopic = "steps.lifecycle" | "flows.lifecycle";

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
} satisfies Record<
  EventType,
  { topic: EventTopic; schema: { event: ZodSchema; data: ZodSchema } }
>;
