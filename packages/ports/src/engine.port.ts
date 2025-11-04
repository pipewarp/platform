// remade zod into types really quick
// TODO: these types need to change

export type StepOutcome = "success" | "failure";
export type StartFlowInput = {
  flowName: string;
  inputs: unknown;
  correlationId: string;
  test?: boolean;
  outfile?: string;
};
export type StartFlowResult = {
  flowRunId: string;
  flowName: string;
  startStepId: string;
  startedAt: string;
};
export type ExecuteStepCommand = {
  stepName: string;
  runId: string;
  taskId: string;
  attempt: number;
  mcpId: string;
  args?: unknown;
};

export interface EnginePort {
  startFlow(input: StartFlowInput): Promise<StartFlowResult | undefined>;
  executeStep(cmd: ExecuteStepCommand): Promise<ExecuteStepCommand | undefined>;
}
