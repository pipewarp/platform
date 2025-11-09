export type ToolDescriptorData = {
  tool: {
    id: string;
    name: string;
    version: string;
  };
};

export type ToolStartedData = ToolDescriptorData & {
  log: string;
  status: "started";
};

export type ToolCompletedData = ToolDescriptorData & {
  status: "completed";
};

export type ToolFailedData = ToolDescriptorData & {
  reason: string;
  status: "failed";
};
