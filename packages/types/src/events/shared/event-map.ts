import type { StepActionQueuedData } from "../step/action/queued.js";
import type { StepActionCompletedData } from "../step/action/completed.js";
import type { StepMcpQueuedData } from "../step/mcp/queued.js";
import type { FlowQueuedData } from "../flow/queued.js";
import type { WorkerRegistrationRequestedData } from "../worker/registration-requested.js";
import type { WorkerRegisteredData } from "../worker/registered.js";

export type DomainActionDescriptor<
  Domain extends string,
  Action extends string,
  Data
> = {
  domain: Domain;
  action: Action;
  entity: undefined;
  data: Data;
};

export type DomainEntityActionDescriptor<
  Domain extends string,
  Entity extends string,
  Action extends string,
  Data
> = {
  domain: Domain;
  entity: Entity;
  action: Action;
  data: Data;
};

export interface EventMap {
  "step.action.queued": DomainEntityActionDescriptor<
    "step",
    "action",
    "queued",
    StepActionQueuedData
  >;
  "step.action.completed": DomainEntityActionDescriptor<
    "step",
    "action",
    "completed",
    StepActionCompletedData
  >;

  "step.mcp.queued": DomainEntityActionDescriptor<
    "step",
    "mcp",
    "queued",
    StepMcpQueuedData
  >;
  "flow.queued": DomainActionDescriptor<"flow", "queued", FlowQueuedData>;

  "worker.registration.requested": DomainEntityActionDescriptor<
    "worker",
    "registration",
    "requested",
    WorkerRegistrationRequestedData
  >;
  "worker.registered": DomainActionDescriptor<
    "worker",
    "registered",
    WorkerRegisteredData
  >;
}

export type EventType = keyof EventMap;
export type EventData<T extends EventType> = EventMap[T]["data"];
export type EventActions = EventMap[EventType]["action"];
export type EventDomains = EventMap[EventType]["domain"];
export type EventEntities = EventMap[EventType]["entity"];

export type StepEventType = Extract<EventType, `step.${string}`>;
export type FlowEventType = Extract<EventType, `flow.${string}`>;
export type WorkerEventType = Extract<EventType, `worker.${string}`>;

// otel attributes for all and per event type
export type OtelAttributesMap = {
  [T in EventType]: Omit<EventMap[T], "data">;
};

export type StepOtelAttributesMap = {
  [T in StepEventType]: Omit<EventMap[T], "data">;
};
export type FlowOtelAttributesMap = {
  [T in FlowEventType]: Omit<EventMap[T], "data">;
};
export type WorkerOtelAttributesMap = {
  [T in WorkerEventType]: Omit<EventMap[T], "data">;
};

export type StepEventData<T extends StepEventType> = EventMap[T]["data"];
export type StepType = StepEventType extends `step.${infer T}.${string}`
  ? T
  : never;
