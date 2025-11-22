/**
 * data structure is preliminary and subject to changes
 */
export type Capability = {
  name: string; // canonical name like "llm.generate" or "v1.stt.transcribe",
  queueId: string; // same as capability name, possibly with workerId

  maxJobCount: number; // 1;

  // tool binding information
  tool: {
    id: "mcp" | "httpjson"; //TODO: move this to external tool types aligned with tools adapter
    // type category to map routing ("process", "remote", "sdk"),
    type: "inprocess" | "remote" | "dynamic";

    // connection details for remote / dynamic tools
    // endpoint?: string;
    // credentialsRef?: string; // reference to credentials db index
  };
  concurrency?: {
    activeJobCount: number; // needed by resource manager, but also in worker
    maxJobCount: number;
  };
  // optional metadata for ui or observability
  metadata?: {
    version?: string; //
    description?: string;
  };
};

// worker description to be stored in the resource manager
export type WorkerMetadata = {
  id: string;
  name: string;
  type: "inprocess" | "remote";
  capabilities: Capability[];
};

type ToolMetadata = {};
export type CapContext = {
  [capid: string]: Cap;
};

export type Cap = {
  name: "llm.generate";
  concurrency: number;
  version: string;
  description: string;
  tools: {
    [toolid: string]: ToolMetadata; // internal? look up from registry, run with payload
    // external? use transport specified, send payload.
  };
};

export class CapManager {
  #ctx: CapContext = {};
  constructor(ctx: CapContext) {}

  addTool() {
    const tool = {
      concurrency: 2,
      timeout: 50,
      location: "internal",
    };
  }
  removeTool() {}
  disableTool() {}
}
