export type StepDescriptor = {
  step: {
    id: string;
    name: string;
    type: string;
  };
};
export type StepStartedData = StepDescriptor & {
  status: "started";
};

export type StepCompletedData = StepDescriptor & {
  status: "completed";
};

export type StepFailedData = StepDescriptor & {
  status: "failed";
  reason: string;
};
