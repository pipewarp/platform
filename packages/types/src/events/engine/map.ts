import type { DomainActionDescriptor } from "../shared/otel-attributes.js";
import type { EngineStartedData, EngineStoppedData } from "./data.js";

export type EngineEventMap = {
  "engine.started": DomainActionDescriptor<
    "engine",
    "started",
    EngineStartedData
  >;
  "engine.stopped": DomainActionDescriptor<
    "engine",
    "stopped",
    EngineStoppedData
  >;
};

export type EET = keyof EngineEventMap;
export type EngineEventType = Extract<keyof EngineEventMap, `engine.${string}`>;
export type EngineEventData<T extends EngineEventType> =
  EngineEventMap[T]["data"];
export type EngineOtelAttributesMap = {
  [T in EngineEventType]: Omit<EngineEventMap[T], "data">;
};
