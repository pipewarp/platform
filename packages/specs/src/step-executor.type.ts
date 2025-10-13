import { z } from "zod";
import type { Step } from "./flow.types.js";
import { RunContext } from "./engine.types.js";
// import { Ports } from "../ports/ports.js";

type Ports = {};

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
  ctx: RunContext;
  step: Step;
  ports: Ports;
}) => Promise<StepResult>;
