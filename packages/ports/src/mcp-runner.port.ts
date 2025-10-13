export interface McpRunnerPort {
  start(): Promise<void>;
  stop(): Promise<void>;
}
