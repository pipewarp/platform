import { z } from "zod";
import type { AnyEvent, FlowScope } from "@pipewarp/types";
import {
  FlowCompletedDataSchema,
  FlowQueuedDataSchema,
  FlowStartedDataSchema,
} from "./flow-data.schema.js";
import { CloudEventContextSchema } from "./cloud-context.schema.js";

export const FlowContextSchema = z
  .object({
    flowid: z.string(),
    domain: z.literal("flow"),
  })
  .strict() satisfies z.ZodType<FlowScope>;

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

export const FlowStartedSchema = CloudEventContextSchema.merge(
  FlowContextSchema
)
  .merge(
    z.object({
      type: z.literal("flow.started"),
      entity: z.undefined().optional(),
      action: z.literal("started"),
      data: FlowStartedDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"flow.started">>;

export const FlowCompletedSchema = CloudEventContextSchema.merge(
  FlowContextSchema
)
  .merge(
    z.object({
      type: z.literal("flow.completed"),
      entity: z.undefined().optional(),
      action: z.literal("completed"),
      data: FlowCompletedDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"flow.completed">>;
