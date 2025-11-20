import { z } from "zod";
import { CloudEventContextSchema } from "./cloud-context.schema.js";
import { RunScope, AnyEvent } from "@lcase/types";
import {
  RunCompletedDataSchema,
  RunStartedDataSchema,
} from "./run.data.schema.js";

export const RunContextSchema = z
  .object({
    flowid: z.string(),
    runid: z.string(),
    domain: z.literal("run"),
  })
  .strict() satisfies z.ZodType<RunScope>;

export const RunStartedSchema = CloudEventContextSchema.merge(RunContextSchema)
  .merge(
    z.object({
      type: z.literal("run.started"),
      entity: z.undefined().optional(),
      action: z.literal("started"),
      data: RunStartedDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"run.started">>;

export const RunCompletedSchema = CloudEventContextSchema.merge(
  RunContextSchema
)
  .merge(
    z.object({
      type: z.literal("run.completed"),
      entity: z.undefined().optional(),
      action: z.literal("completed"),
      data: RunCompletedDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"run.completed">>;
