import type { StepEvent } from "../../shared/step-event.js";

export type StepActionQueuedData = {
  tool: string;
  op: string;
  profile?: string;
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

export type StepActionQueued = StepEvent<"step.action.queued">;
