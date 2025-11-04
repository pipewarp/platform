import type { StepEvent } from "../../shared/step-event.js";

export type StepActionCompletedData = {
  ok: boolean;
  message: string;
  result?: unknown;
  error?: string;
};

export type StepActionCompleted = StepEvent<"step.action.completed">;
