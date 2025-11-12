import { z } from "zod";
import { CloudEventContextSchema } from "./cloud-context.schema.js";
import type { AnyEvent, SystemScope } from "@pipewarp/types";
import { SystemLoggedDataSchema } from "./system.data.schema.js";

export const SystemContextSchema = z
  .object({
    flowid: z.string().optional(),
    runid: z.string().optional(),
    stepid: z.string().optional(),
    jobid: z.string().optional(),
    toolid: z.string().optional(),
    steptype: z.string().optional(),
    domain: z.literal("system"),
  })
  .strict() satisfies z.ZodType<SystemScope>;

export const SystemLoggedSchema = CloudEventContextSchema.merge(
  SystemContextSchema
)
  .merge(
    z.object({
      type: z.literal("system.logged"),
      entity: z.undefined().optional(),
      action: z.literal("logged"),
      data: SystemLoggedDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"system.logged">>;
