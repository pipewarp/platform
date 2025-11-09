import type { RunCompletedData, RunStartedData } from "./data.js";
import type { DomainActionDescriptor } from "../shared/otel-attributes.js";

export type RunEventMap = {
  "run.started": DomainActionDescriptor<"run", "started", RunStartedData>;
  "run.completed": DomainActionDescriptor<"run", "completed", RunCompletedData>;
};

export type RET = keyof RunEventMap;
export type RunEventType = Extract<keyof RunEventMap, `run.${string}`>;
export type RunEventData<T extends RunEventType> = RunEventMap[T]["data"];
export type RunOtelAttributesMap = {
  [T in RunEventType]: Omit<RunEventMap[T], "data">;
};
