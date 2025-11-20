export interface FlowStorePort {
  readFlow(args: { filePath?: string }): string | undefined;
  readFlows(args: {dir?: string}): Map<string, unknown>;
}