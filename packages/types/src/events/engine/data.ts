type EngineDescriptor = {
  engine: {
    id: string;
    version: string;
  };
};
export type EngineStartedData = EngineDescriptor & {
  status: "started";
};

export type EngineStoppedData = EngineDescriptor & {
  status: "stopped";
  reason: string;
};
