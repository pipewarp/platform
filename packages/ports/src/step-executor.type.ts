import { z } from "zod";

type InvokeRequest = {};
type InvokeContext = {};

export const StepResultSchema = z.object({
  ok: z.boolean(),
  result: z.record(z.string(), z.unknown()),
  exports: z.record(z.string(), z.unknown()).optional(),
  next: z.string().optional(),
  error: z
    .object({
      message: z.string(),
      code: z.string().optional(),
    })
    .optional(),
});

export type StepResult = z.infer<typeof StepResultSchema>;

export type StepExecutor = (args: {
  ctx: InvokeContext;
  invokeRequest: InvokeRequest;
}) => Promise<StepResult>;
