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

export const McpStepSchema = BaseStepSchema.extend({
  type: z.literal("mcp"),
  url: z.string(),
  transport: z.enum(["sse", "stdio", "streamable-http", "http"]),
  feature: z.object({
    primitive: z.enum([
      "resource",
      "prompt",
      "tool",
      "sampling",
      "roots",
      "elicitation",
    ]),
    name: z.string(),
  }),
  pipe: z
    .object({
      to: z
        .object({
          step: z.string(),
          payload: z.string(),
        })
        .optional(),
      from: z
        .object({
          step: z.string(),
          buffer: z.number().optional(),
        })
        .optional(),
    })
    .optional(),
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
  pipe: z
    .object({
      to: z
        .object({
          step: z.string(),
          payload: z.string(),
        })
        .optional(),
      from: z
        .object({
          step: z.string(),
          buffer: z.number().optional(),
        })
        .optional(),
    })
    .optional(),
});

export const HttpStepSchema = BaseStepSchema.extend({
  type: z.literal("http"),
  url: z.string().url(),
});

export const StepSchema = z.discriminatedUnion("type", [
  // ToolStepSchema,
  // HttpStepSchema,
  McpStepSchema,
  ActionStepSchema,
]);

export type Step = z.infer<typeof StepSchema>;
export type McpStep = z.infer<typeof McpStepSchema>;
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
