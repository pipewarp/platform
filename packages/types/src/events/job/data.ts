export type JobDescriptor = {
  job: {
    id: string;
    capability: string;
  };
};

export type JobMcpQueuedData = JobDescriptor & {
  url: string;
  transport: "sse" | "stdio" | "streamable-http" | "http";
  feature: {
    primitive:
      | "resource"
      | "prompt"
      | "tool"
      | "sampling"
      | "roots"
      | "elicitation";
    name: string;
  };
  args?: Record<string, unknown>;
  pipe: {
    to?: {
      id: string;
      payload: string;
    };
    from?: {
      id: string;
      buffer?: number;
    };
  };
};

export type JobStartedData = JobDescriptor & {
  status: "started";
};

export type JobCompletedData = JobDescriptor & {
  status: "completed";
  result?: unknown;
};

export type JobFailedData = JobDescriptor & {
  status: "failed";
  result?: unknown;
  reason: string;
};
