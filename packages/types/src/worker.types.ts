export type Capability = {
  name: string; // canonical name like "llm.generate" or "v1.stt.transcribe",
  aliases?: string; // optional alias for flow step map

  queueId: string; // same as capability name, possibly with workerId
  activeJobCount: number; // 0;
  maxJobCount: number; // 1;

  // tool binding information
  tool: {
    id: string;
    // type category to map routing ("process", "remote", "sdk"),
    type: "inprocess" | "remote" | "dynamic";

    // connection details for remote / dynamic tools
    endpoint?: string;
    credentialsRef?: string; // reference to credentials db index
  };
  concurrency?: {
    activeJobCount: number;
    maxJobCount: number;
  };
  // optional metadata for ui or observability?
  metadata?: {
    version?: string; //
    description?: string;
  };
};

export type WorkerMetadata = {
  id: string;
  name: string;
  type: "inprocess" | "remote";
  capabilities: Capability[];
};
