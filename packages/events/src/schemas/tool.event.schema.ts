import { z } from "zod";
import { CloudEventContextSchema } from "./cloud-context.schema.js";
import type { AnyEvent, ToolScope } from "@lcase/types";
import {
  ToolCompletedDataSchema,
  ToolFailedDataSchema,
  ToolStartedDataSchema,
} from "./tool.data.schema.js";

export const ToolContextSchema = z
  .object({
    flowid: z.string(),
    runid: z.string(),
    stepid: z.string(),
    jobid: z.string(),
    toolid: z.string(),
    domain: z.literal("tool"),
  })
  .strict() satisfies z.ZodType<ToolScope>;

export const ToolStartedSchema = CloudEventContextSchema.merge(
  ToolContextSchema
)
  .merge(
    z.object({
      type: z.literal("tool.started"),
      entity: z.undefined().optional(),
      action: z.literal("started"),
      data: ToolStartedDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"tool.started">>;

export const ToolCompletedSchema = CloudEventContextSchema.merge(
  ToolContextSchema
)
  .merge(
    z.object({
      type: z.literal("tool.completed"),
      entity: z.undefined().optional(),
      action: z.literal("completed"),
      data: ToolCompletedDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"tool.completed">>;

export const ToolFailedSchema = CloudEventContextSchema.merge(ToolContextSchema)
  .merge(
    z.object({
      type: z.literal("tool.failed"),
      entity: z.undefined().optional(),
      action: z.literal("failed"),
      data: ToolFailedDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"tool.failed">>;
