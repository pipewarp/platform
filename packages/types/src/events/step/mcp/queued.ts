import type { StepEvent } from "../../shared/step-event.js";

export type StepMcpQueuedData = {
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

export type StepMcpQueued = StepEvent<"step.mcp.queued">;
