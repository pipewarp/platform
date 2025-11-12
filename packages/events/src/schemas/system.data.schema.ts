import { z } from "zod";
import type { SystemLoggedData } from "@pipewarp/types";

export const SystemLoggedDataSchema = z
  .object({
    log: z.string(),
    payload: z.unknown().optional(),
  })
  .strict() satisfies z.ZodType<SystemLoggedData>;
