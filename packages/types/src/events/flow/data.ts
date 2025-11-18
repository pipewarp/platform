export type FlowDescriptor = {
  flow: {
    id: string;
    name: string;
    version: string;
  };
};

export type FlowQueuedData = FlowDescriptor & {
  flowName: string;
  inputs: Record<string, unknown>;
  test?: boolean;
  outfile: string;
  definition: unknown;
};

export type FlowStartedData = FlowDescriptor & {};
export type FlowCompletedData = FlowDescriptor & {};
