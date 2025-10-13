import { z } from "zod";

export const StatusSchema = z.enum([
  "running",
  "waiting",
  "queued",
  "idle",
  "started",
  "stopped",
  "aborted",
  "success",
  "failure",
  "error",
]);

export type Status = z.infer<typeof StatusSchema>;

export const RunStepContextSchema = z.object({
  status: StatusSchema,
});

export const RunContextSchema = z.object({
  runId: z.string().min(1),
  flowName: z.string().min(1),
  test: z.boolean().default(false).optional(),
  outFile: z.string().default("./output.json").optional(),
  inputs: z.record(z.string(), z.unknown()),
  exports: z.record(z.string(), z.unknown()),
  globals: z.record(z.string(), z.unknown()),
  status: StatusSchema,
  steps: z.record(
    z.string(),
    z.object({
      status: StatusSchema,
      reason: z.string().optional(),
      attempt: z.number(),
      exports: z.record(z.string(), z.unknown()),
      result: z.record(z.string(), z.unknown()),
      // TODO: implement history, an array of attempts and outputs
    })
  ),
});

export type RunContext = z.infer<typeof RunContextSchema>;
