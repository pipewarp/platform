import { z } from "zod";
export const StepActionQueuedSchema = z.object({
  kind: z.enum(["step.action.queued"]),
  runId: z.string().min(1),
  data: z.object({
    tool: z.string().min(1),
    op: z.string().min(1),
    profile: z.string().min(1).optional(),
    args: z.record(z.string(), z.unknown()).optional(),
  }),
});
