import { z } from "zod";
import type { SystemLoggedData } from "@lcase/types";

export const SystemLoggedDataSchema = z
  .object({
    log: z.string(),
    payload: z.unknown().optional(),
  })
  .strict() satisfies z.ZodType<SystemLoggedData>;
