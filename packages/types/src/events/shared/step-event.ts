import type { PipewarpContext } from "./pipewarp-context.js";
import type { StepEventType, StepTypeFor } from "./event-map.js";
import { CloudEvent } from "./cloud-event.js";

export type StepContext<T extends StepEventType> = {
  flowId: string;
  runId: string;
  stepId: string;
  stepType: StepTypeFor<T>;
};

export type StepEvent<T extends StepEventType> = Omit<
  PipewarpContext,
  keyof StepContext<T>
> &
  StepContext<T> &
  CloudEvent<T>;
