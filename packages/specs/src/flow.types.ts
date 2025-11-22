import { z } from "zod";
import type { StepHttpJson } from "@lcase/types";

export const OnSchema = z.object({
  success: z.string().optional(),
  failure: z.string().optional(),
});

export const StepArgsSchema = z.record(z.string(), z.unknown());
export type StepArgs = z.infer<typeof StepArgsSchema>;

export const StepBaseSchema = z.object({
  args: StepArgsSchema.optional(),
  on: OnSchema.optional(),
});

export const StepMcpSchema = StepBaseSchema.extend({
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

export const StepHttpJsonSchema = StepBaseSchema.extend({
  type: z.literal("httpjson"),
  url: z.string().url(),
  method: z
    .enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"])
    .optional(),

  headers: z.record(z.string(), z.unknown()).optional(),
  body: z.record(z.string(), z.unknown()).optional(),
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
}).strict() satisfies z.ZodType<StepHttpJson>;

export const StepSchema = z.discriminatedUnion("type", [
  StepHttpJsonSchema,
  StepMcpSchema,
]);

export type Step = z.infer<typeof StepSchema>;
export type McpStep = z.infer<typeof StepMcpSchema>;

export const FlowSchema = z.object({
  name: z.string().min(1),
  version: z.string(),
  description: z.string().optional(),
  inputs: z.record(z.string(), z.unknown()).default({}),
  outputs: z.record(z.string(), z.unknown()).default({}),
  start: z.string().min(1),
  steps: z.record(z.string(), StepSchema),
});

export type Flow = z.infer<typeof FlowSchema>;
