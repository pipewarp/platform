import { z } from "zod";

export const OnSchema = z.object({
  success: z.string().optional(),
  failure: z.string().optional(),
});

export const StepArgsSchema = z.record(z.string(), z.unknown());
export type StepArgs = z.infer<typeof StepArgsSchema>;

export const BaseStepSchema = z.object({
  args: StepArgsSchema.optional(),
  on: OnSchema.optional(),
});

// TODO: Old step format; to be removed
export const ToolStepSchema = BaseStepSchema.extend({
  type: z.literal("tool"),
  mcp: z.string().min(1),
  tool: z.string().min(1),
});

export const ActionStepSchema = BaseStepSchema.extend({
  type: z.literal("action"),
  tool: z.string().min(1),
  op: z.string().min(1),
  target: z
    .object({
      profile: z.string().min(1).optional(),
      service: z.string().min(1).optional(),
    })
    .optional(),
});

export const HttpStepSchema = BaseStepSchema.extend({
  type: z.literal("http"),
  url: z.string().url(),
});

export const StepSchema = z.discriminatedUnion("type", [
  ToolStepSchema,
  HttpStepSchema,
  ActionStepSchema,
]);

export type Step = z.infer<typeof StepSchema>;
export type ToolStep = z.infer<typeof ToolStepSchema>;
export type HttpStep = z.infer<typeof HttpStepSchema>;
export type ActionStep = z.infer<typeof ActionStepSchema>;

export const FlowSchema = z.object({
  name: z.string().min(1),
  inputs: z.record(z.string(), z.unknown()).default({}),
  outputs: z.record(z.string(), z.unknown()).default({}),
  start: z.string().min(1),
  steps: z.record(z.string(), StepSchema),
});

export type Flow = z.infer<typeof FlowSchema>;
