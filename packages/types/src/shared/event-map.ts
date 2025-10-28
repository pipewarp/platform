import type { StepActionQueuedData } from "../step/action/queued.js";
import type { StepActionCompletedData } from "../step/action/completed.js";
import type { FlowQueuedData } from "../flow/queued.js";

export interface EventMap {
  "step.action.queued": StepActionQueuedData;
  "step.action.completed": StepActionCompletedData;
  "flow.queued": FlowQueuedData;
}

export type EventType = keyof EventMap;
export type EventData<T extends EventType> = EventMap[T];

export type StepEventType = Extract<EventType, `step.${string}`>;
export type FlowEventType = Extract<EventType, `flow.${string}`>;

export type StepType = StepEventType extends `step.${infer T}.${string}`
  ? T
  : never;

export type StepTypeFor<T extends EventType> =
  T extends `step.${infer T}.${string}` ? T : never;
