import { z } from "zod";

export const FlowNameSchema = z.string();
export const FlowRunIdSchema = z.string();
export const StepIdSchema = z.string();
export const TaskIdSchema = z.string();
export const ResourecKeySchema = z.string();

export const StepOutcomeSchema = z.union([
  z.literal("success"),
  z.literal("failure"),
]);

export const StartFlowInputSchema = z.object({
  flowName: FlowNameSchema,
  inputs: z.unknown(),
  correlationId: z.string(),
});

export type StartFlowInput = z.infer<typeof StartFlowInputSchema>;

export const StartFlowResultSchema = z.object({
  flowRunId: FlowRunIdSchema,
  flowName: FlowNameSchema,
  startStepId: StepIdSchema,
  startedAt: z.string(), // iso date string
});

export type StartFlowResult = z.infer<typeof StartFlowInputSchema>;

export const ExecuteStepCommandSchema = z.object({
  stepName: StepIdSchema,
  runId: FlowNameSchema,
  taskId: TaskIdSchema,
  attempt: z.number(),
  mcpId: ResourecKeySchema,
  args: z.unknown().optional(),
  timeoutMs: z.number().optional(),
});

export type ExecuteStepCommand = z.infer<typeof ExecuteStepCommandSchema>;

export const ExecuteStepResultSchema = z.object({
  outcome: StepOutcomeSchema,
  retriable: z.boolean().optional(),
  resultSummary: z.unknown().optional(),
  errorSummary: z.unknown().optional(),
  next: z.object({
    stepId: StepIdSchema,
  }),
});

export interface EnginePort {
  startFlow(input: StartFlowInput): Promise<StartFlowResult>;
  executeStep(cmd: ExecuteStepCommand): Promise<ExecuteStepCommand>;
}
