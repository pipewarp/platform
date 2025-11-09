import { z } from "zod";
import type {
  CloudEvent,
  EventType,
  EventActions,
  EventDomains,
  EventEntities,
} from "@pipewarp/types";

export const eventTypes = [
  "flow.queued",
  "flow.started",
  "flow.completed",
  "engine.started",
  "engine.stopped",
  "run.completed",
  "run.started",
  "step.started",
  "step.completed",
  "step.failed",
  "job.mcp.queued",
  "job.completed",
  "job.started",
  "job.failed",
  "worker.registered",
  "worker.registration.requested",
  "step.started",
] as const satisfies readonly EventType[];

// make sure the event types list is complete and not missing any events
type MissingEventTypes = Exclude<EventType, (typeof eventTypes)[number]>;
// utility type not used, just checks provides compile time error if type is missing
type _ListsAllEventTypes = MissingEventTypes extends never ? true : never;
const _checkEventTypes: _ListsAllEventTypes = true;

// export const stepTypes = [
//   "action",
//   "mcp",
//   undefined,
// ] as const satisfies readonly StepType[];

// make sure the event types list is complete and not missing any events
// type MissingStepTypes = Exclude<StepType, (typeof stepTypes)[number]>;
// utility type not used, just checks provides compile time error if type is missing
// type _ListsAllStepTypes = MissingStepTypes extends never ? true : never;
// const _checkStepTypes: _ListsAllStepTypes = true;

export type CloudEventContext<T extends EventType> = Omit<
  CloudEvent<T>,
  "data"
>;

export const actionTypes = [
  "completed",
  "queued",
  "registered",
  "requested",
  "started",
  "completed",
  "stopped",
  "failed",
] as const satisfies readonly EventActions[];

export const domainTypes = [
  "flow",
  "run",
  "step",
  "job",
  "engine",
  "worker",
] as const satisfies readonly EventDomains[];

export const entityTypes = [
  "registration",
] as const satisfies readonly EventEntities[];

export const CloudEventContextSchema = z
  .object({
    id: z.string(),
    source: z.string(),
    specversion: z.literal("1.0"),
    time: z.string(),
    type: z.enum(eventTypes),

    domain: z.enum(domainTypes),
    action: z.enum(actionTypes),
    entity: z.enum(entityTypes).optional(),

    traceparent: z.string(),
    tracestate: z.string().optional(),

    traceid: z.string(),
    spanid: z.string(),
    parentspanid: z.string().optional(),

    subject: z.string().optional(),
    datacontenttype: z.string().optional(),
    dataschema: z.string().optional(),
  })
  .strict() satisfies z.ZodType<CloudEventContext<EventType>>;
