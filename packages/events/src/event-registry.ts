import type { ZodTypeAny } from "zod";
import type { EventKind } from "@pipewarp/types";
import {
  StepQueuedEventSchema,
  FlowQueuedEventSchema,
  StepCompletedEventSchema,
} from "./events.schema.js";

export class EventRegistry {
  #registry = new Map<EventKind, ZodTypeAny>();
  register(type: EventKind, schema: ZodTypeAny): void {
    this.#registry.set(type, schema);
  }
  get(type: EventKind): ZodTypeAny | undefined {
    if (!this.#registry.has(type)) return;
    return this.#registry.get(type);
  }
}

type EventTopic = "steps.lifecycle" | "flows.lifecycle";

export const registry = {
  "step.queued": {
    topic: "steps.lifecycle",
    schema: StepQueuedEventSchema,
  },
  "step.completed": {
    topic: "steps.lifecycle",
    schema: StepCompletedEventSchema,
  },
  "flow.queued": {
    topic: "flows.lifecycle",
    schema: FlowQueuedEventSchema,
  },
} satisfies Record<EventKind, { topic: EventTopic; schema: ZodTypeAny }>;
