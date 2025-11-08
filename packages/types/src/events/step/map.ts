import type { DomainActionDescriptor } from "../event-map.js";
import { StepCompletedData, StepFailedData, StepStartedData } from "./data.js";

export type StepEventMap = {
  "step.started": DomainActionDescriptor<"step", "started", StepStartedData>;
  "step.completed": DomainActionDescriptor<
    "step",
    "completed",
    StepCompletedData
  >;
  "step.failed": DomainActionDescriptor<"step", "failed", StepFailedData>;
};

export type StepEventType = Extract<keyof StepEventMap, `step.${string}`>;
export type StepEventData<T extends StepEventType> = StepEventMap[T]["data"];
export type StepOtelAttributesMap = {
  [T in StepEventType]: Omit<StepEventMap[T], "data">;
};
