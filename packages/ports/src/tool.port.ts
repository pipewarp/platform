// not yet implemented

export type ToolContext = {
  flowId: string;
  runId: string;
  stepId: string;
  capability: string;
  workerId: string;
  auth?: Record<string, string>;
  config?: Record<string, string>;
};
export interface ToolPort {
  id: string;
  name: string;
  invoke(input: unknown, context: ToolContext): Promise<any>;
}
