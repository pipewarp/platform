import { z } from "zod";
import type { EngineStartedData, EngineStoppedData } from "@pipewarp/types";

const EngineDescriptorSchema = z.object({
  id: z.string(),
  version: z.string(),
});
export const EngineStartedDataSchema = z
  .object({
    status: z.literal("started"),
    engine: EngineDescriptorSchema,
  })
  .strict() satisfies z.ZodType<EngineStartedData>;

export const EngineStoppedDataSchema = z
  .object({
    status: z.literal("stopped"),
    reason: z.string(),
    engine: EngineDescriptorSchema,
  })
  .strict() satisfies z.ZodType<EngineStoppedData>;
