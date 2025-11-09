import type { EngineEventMap } from "./engine/map.js";
import type { RunEventMap } from "./run/map.js";
import type { StepEventMap } from "./step/map.js";
import type { JobEventMap } from "./job/map.js";
import type { ToolEventMap } from "./tool/map.js";
import type { WorkerEventMap } from "./worker/map.js";
import type { FlowEventMap } from "./flow/map.js";

export type EventMap = EngineEventMap &
  FlowEventMap &
  RunEventMap &
  StepEventMap &
  JobEventMap &
  ToolEventMap &
  WorkerEventMap;

export type EventType = keyof EventMap;
export type EventData<T extends EventType> = EventMap[T]["data"];
export type EventActions = EventMap[EventType]["action"];
export type EventDomains = EventMap[EventType]["domain"];
export type EventEntities = EventMap[EventType]["entity"];

// otel attributes for all and per event type
export type OtelAttributesMap = {
  [T in EventType]: Omit<EventMap[T], "data">;
};
