
export type ValidFlowDescriptor = {
  filename: string;
  name: string;
  version: string;
  description?: string;
  absolutePath: string;
};
  
export type InvalidFlowDescriptor = {
  errorMessage: string;
};


export type FlowList = {
  validFlows: {
    [flowId: string]: ValidFlowDescriptor
  };
  invalidFlows: {
   [path: string]: InvalidFlowDescriptor;
  }
};