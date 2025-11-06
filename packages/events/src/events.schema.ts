import { z } from "zod";
import type {
  AnyEvent,
  StepActionQueuedData,
  StepActionCompletedData,
  StepMcpQueuedData,
  CloudEvent,
  EventType,
  StepType,
  StepScope,
  FlowScope,
  FlowQueuedData,
  EventActions,
  EventDomains,
  EventEntities,
} from "@pipewarp/types";

export const eventTypes = [
  "flow.queued",
  "step.action.queued",
  "step.action.completed",
  "step.mcp.queued",
  "worker.registered",
  "worker.registration.requested",
] as const satisfies readonly EventType[];

// make sure the event types list is complete and not missing any events
type MissingEventTypes = Exclude<EventType, (typeof eventTypes)[number]>;
// utility type not used, just checks provides compile time error if type is missing
type _CheckNoneMissing = MissingEventTypes extends never ? true : never;
const _checkEventTypes: _CheckNoneMissing = true;

export const stepTypes = [
  "action",
  "mcp",
] as const satisfies readonly StepType[];

// make sure the event types list is complete and not missing any events
type MissingStepTypes = Exclude<StepType, (typeof stepTypes)[number]>;
// utility type not used, just checks provides compile time error if type is missing
type _CheckNoStepMissing = MissingStepTypes extends never ? true : never;
const _checkStepTypes: _CheckNoStepMissing = true;

export type CloudEventContext<T extends EventType> = Omit<
  CloudEvent<T>,
  "data"
>;

export const actionTypes = [
  "completed",
  "queued",
  "registered",
  "requested",
] as const satisfies readonly EventActions[];

export const domainTypes = [
  "flow",
  "step",
  "worker",
] as const satisfies readonly EventDomains[];

export const entityTypes = [
  "action",
  "mcp",
  "registration",
] as const satisfies readonly EventEntities[];

export const CloudEventContextSchema = z
  .object({
    id: z.string(),
    source: z.string(),
    specversion: z.literal("1.0"),
    correlationId: z.string(),
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

export const FlowContextSchema = z
  .object({
    flowid: z.string(),
    domain: z.literal("flow"),
  })
  .strict() satisfies z.ZodType<FlowScope>;

export const StepContextSchema = z
  .object({
    flowid: z.string(),
    runid: z.string(),
    stepid: z.string(),
    domain: z.literal("step"),
  })
  .strict() satisfies z.ZodType<StepScope>;

export const StepActionQueuedDataSchema = z
  .object({
    tool: z.string().min(1),
    op: z.string().min(1),
    profile: z.string().min(1).optional(),
    args: z.record(z.string(), z.unknown()).optional(),
    pipe: z.object({
      to: z
        .object({
          id: z.string(),
          payload: z.string(),
        })
        .optional(),
      from: z
        .object({
          id: z.string(),
          buffer: z.number().optional(),
        })
        .optional(),
    }),
  })
  .strict() satisfies z.ZodType<StepActionQueuedData>;

export const StepActionCompletedDataSchema = z
  .object({
    ok: z.boolean(),
    message: z.string(),
    result: z.unknown().optional(),
    error: z.string().optional(),
  })
  .strict() satisfies z.ZodType<StepActionCompletedData>;

export const StepMcpQueuedDataSchema = z
  .object({
    url: z.string(),
    transport: z.enum(["sse", "stdio", "streamable-http", "http"]),
    feature: z.object({
      primitive: z.enum([
        "resource",
        "prompt",
        "tool",
        "sampling",
        "roots",
        "elicitation",
      ]),
      name: z.string(),
    }),
    args: z.record(z.string(), z.unknown()).optional(),
    pipe: z.object({
      to: z
        .object({
          id: z.string(),
          payload: z.string(),
        })
        .optional(),
      from: z
        .object({
          id: z.string(),
          buffer: z.number().optional(),
        })
        .optional(),
    }),
  })
  .strict() satisfies z.ZodType<StepMcpQueuedData>;

export const FlowQueuedDataSchema = z
  .object({
    flowName: z.string(),
    inputs: z.record(z.string(), z.unknown()),
    outfile: z.string(),
    test: z.boolean().optional(),
  })
  .strict() satisfies z.ZodType<FlowQueuedData>;

export const StepActionQueuedSchema = CloudEventContextSchema.merge(
  StepContextSchema
)
  .merge(
    z.object({
      type: z.literal("step.action.queued"),
      entity: z.literal("action"),
      action: z.literal("queued"),
      data: StepActionQueuedDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"step.action.queued">>;

export const StepActionCompletedSchema = CloudEventContextSchema.merge(
  StepContextSchema
)
  .merge(
    z.object({
      // stepType: z.literal("action"),
      type: z.literal("step.action.completed"),
      entity: z.literal("action"),
      action: z.literal("completed"),
      data: StepActionCompletedDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"step.action.completed">>;

export const StepMcpQueuedSchema = CloudEventContextSchema.merge(
  StepContextSchema
)
  .merge(
    z.object({
      stepType: z.literal("mcp"),
      type: z.literal("step.mcp.queued"),
      entity: z.literal("mcp"),
      action: z.literal("queued"),
      data: StepMcpQueuedDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"step.mcp.queued">>;

export const FlowQueuedSchema = CloudEventContextSchema.merge(FlowContextSchema)
  .merge(
    z.object({
      type: z.literal("flow.queued"),
      entity: z.undefined().optional(),
      action: z.literal("queued"),
      data: FlowQueuedDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"flow.queued">>;
