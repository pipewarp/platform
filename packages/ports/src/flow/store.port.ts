export interface FlowStorePort {
  readFlow(args: { filePath?: string }): unknown;
  readFlows(args: {dir?: string}): Map<string, unknown>;
}