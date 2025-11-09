import type { DomainActionDescriptor } from "../shared/otel-attributes.js";
import type {
  FlowQueuedData,
  FlowCompletedData,
  FlowStartedData,
} from "./data.js";

export type FlowEventMap = {
  "flow.queued": DomainActionDescriptor<"flow", "queued", FlowQueuedData>;
  "flow.started": DomainActionDescriptor<"flow", "started", FlowStartedData>;
  "flow.completed": DomainActionDescriptor<
    "flow",
    "completed",
    FlowCompletedData
  >;
};

export type FlowEventType = keyof FlowEventMap;
export type FlowEventData<T extends FlowEventType> = FlowEventMap[T]["data"];
export type FlowOtelAttributesMap = {
  [T in FlowEventType]: Omit<FlowEventMap[T], "data">;
};
