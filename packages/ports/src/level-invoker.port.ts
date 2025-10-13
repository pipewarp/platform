// simple Level invoke interface
// skeleton to help shape StepExecutor
export interface LevelInvokerPort {
  invoke(world: string, level: string, args: unknown): Promise<unknown>;
}
