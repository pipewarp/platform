import { z } from "zod";

export const TestResultSchema = z.object({
  runId: z.string(),
  flow: z.object({
    name: z.string(),
    path: z.string(),
  }),
  status: z.enum(["ok", "error"]),
});
