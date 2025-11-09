import { DomainActionDescriptor } from "../shared/otel-attributes.js";
import { ToolCompletedData, ToolFailedData, ToolStartedData } from "./data.js";

export type ToolEventMap = {
  "tool.started": DomainActionDescriptor<"tool", "started", ToolStartedData>;
  "tool.completed": DomainActionDescriptor<
    "tool",
    "completed",
    ToolCompletedData
  >;
  "tool.failed": DomainActionDescriptor<"tool", "failed", ToolFailedData>;
};

export type ToolEventType = keyof ToolEventMap;
export type ToolEventData<T extends ToolEventType> = ToolEventMap[T]["data"];
export type ToolOtelAttributesMap = {
  [T in ToolEventType]: Omit<ToolEventMap[T], "data">;
};
