import { z } from "zod";

export const OnSchema = z.object({
  success: z.string(),
  failure: z.string(),
});

export const StepArgsSchema = z.record(z.string(), z.unknown());
export type StepArgs = z.infer<typeof StepArgsSchema>;

export const BaseStepSchema = z.object({
  args: StepArgsSchema.optional(),
  on: OnSchema.optional(),
});

export const ToolStepSchema = BaseStepSchema.extend({
  type: z.enum(["tool"]),
  mcp: z.string().min(1),
  tool: z.string().min(1),
});

export const HttpStepSchema = BaseStepSchema.extend({
  type: z.enum(["http"]),
  url: z.string().url(),
});

export const StepSchema = z.discriminatedUnion("type", [
  ToolStepSchema,
  HttpStepSchema,
]);

export type Step = z.infer<typeof StepSchema>;
export type ToolStep = z.infer<typeof ToolStepSchema>;
export type HttpStep = z.infer<typeof HttpStepSchema>;

export const FlowSchema = z.object({
  name: z.string().min(1),
  inputs: z.record(z.string(), z.unknown()).default({}),
  outputs: z.record(z.string(), z.unknown()).default({}),
  start: z.string().min(1),
  steps: z.record(z.string(), StepSchema),
});

export type Flow = z.infer<typeof FlowSchema>;

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
      attempt: z.number(),
      exports: z.record(z.string(), z.unknown()),
      result: z.record(z.string(), z.unknown()),
      // TODO: implement history, an array of attemps and outputs
    })
  ),
});

export type RunContext = z.infer<typeof RunContextSchema>;
