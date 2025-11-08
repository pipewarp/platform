import { z } from "zod";
import { CloudEventContextSchema } from "./cloud-context.schema.js";
import type { StepScope, AnyEvent } from "@pipewarp/types";
import {
  StepCompletedDataSchema,
  StepFailedDataSchema,
  StepStartedDataSchema,
} from "./step.data.schema.js";

export const StepContextSchema = z
  .object({
    flowid: z.string(),
    runid: z.string(),
    stepid: z.string(),
    steptype: z.string(),
    domain: z.literal("step"),
  })
  .strict() satisfies z.ZodType<StepScope>;

export const StepStartedSchema = CloudEventContextSchema.merge(
  StepContextSchema
)
  .merge(
    z.object({
      type: z.literal("step.started"),
      entity: z.undefined().optional(),
      action: z.literal("started"),
      steptype: z.string(),
      data: StepStartedDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"step.started">>;

export const StepCompletedSchema = CloudEventContextSchema.merge(
  StepContextSchema
)
  .merge(
    z.object({
      type: z.literal("step.completed"),
      entity: z.undefined().optional(),
      action: z.literal("completed"),
      steptype: z.string(),
      data: StepCompletedDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"step.completed">>;

export const StepFailedSchema = CloudEventContextSchema.merge(StepContextSchema)
  .merge(
    z.object({
      type: z.literal("step.failed"),
      entity: z.undefined().optional(),
      action: z.literal("failed"),
      steptype: z.string(),
      data: StepFailedDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"step.failed">>;
