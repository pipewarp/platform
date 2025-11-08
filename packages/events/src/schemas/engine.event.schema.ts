import { z } from "zod";
import type { AnyEvent } from "@pipewarp/types";
import { CloudEventContextSchema } from "./cloud-context.schema.js";
import {
  EngineStartedDataSchema,
  EngineStoppedDataSchema,
} from "./engine.data.schema.js";

export const EngineContextSchema = z
  .object({
    engineid: z.string(),
    domain: z.literal("engine"),
  })
  .strict();

export const EngineStartedSchema = CloudEventContextSchema.merge(
  EngineContextSchema
)
  .merge(
    z.object({
      type: z.literal("engine.started"),
      entity: z.undefined().optional(),
      action: z.literal("started"),
      data: EngineStartedDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"engine.started">>;
export const EngineStoppedSchema = CloudEventContextSchema.merge(
  EngineContextSchema
)
  .merge(
    z.object({
      type: z.literal("engine.stopped"),
      entity: z.undefined().optional(),
      action: z.literal("stopped"),
      data: EngineStoppedDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"engine.stopped">>;
