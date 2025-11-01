import { z, ZodSchema } from "zod";
import type {
  AnyEvent,
  StepActionQueuedData,
  StepActionCompletedData,
  StepMcpQueuedData,
  CloudEvent,
  EventType,
  StepType,
  StepEventType,
  StepContext,
  FlowContext,
  FlowQueuedData,
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

export const stepTypes = [
  "action",
  "mcp",
] as const satisfies readonly StepType[];

// make sure the event types list is complete and not missing any events
type MissingStepTypes = Exclude<StepType, (typeof stepTypes)[number]>;
// utility type not used, just checks provides compile time error if type is missing
type _CheckNoStepMissing = MissingStepTypes extends never ? true : never;

export type CloudEventContext<T extends EventType> = Omit<
  CloudEvent<T>,
  "data"
>;

export const CloudEventContextSchema = z
  .object({
    id: z.string(),
    source: z.string(),
    specversion: z.literal("1.0"),
    correlationId: z.string(),
    time: z.string(),
    type: z.enum(eventTypes),
    subject: z.string().optional(),
    datacontenttype: z.string().optional(),
    dataschema: z.string().optional(),
  })
  .strict() satisfies z.ZodType<CloudEventContext<EventType>>;

export const FlowContextSchema = z
  .object({
    flowId: z.string(),
  })
  .strict() satisfies z.ZodType<FlowContext>;

export const StepContextSchema = z
  .object({
    flowId: z.string(),
    runId: z.string(),
    stepId: z.string(),
    stepType: z.enum(stepTypes),
  })
  .strict() satisfies z.ZodType<StepContext<StepEventType>>;

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
    stepType: z.literal("action"),
    ok: z.boolean(),
    message: z.string(),
    result: z.unknown().optional(),
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
      stepType: z.literal("action"),
      type: z.literal("step.action.queued"),
      data: StepActionQueuedDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"step.action.queued">>;

export const StepActionCompletedSchema = CloudEventContextSchema.merge(
  StepContextSchema
)
  .merge(
    z.object({
      stepType: z.literal("action"),
      type: z.literal("step.action.completed"),
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
      data: StepMcpQueuedDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"step.mcp.queued">>;

export const FlowQueuedSchema = CloudEventContextSchema.merge(FlowContextSchema)
  .merge(
    z.object({
      type: z.literal("flow.queued"),
      data: FlowQueuedDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"flow.queued">>;
