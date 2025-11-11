import type { DomainActionDescriptor } from "../shared/otel-attributes.js";
import { SystemLoggedData } from "./data.js";

export type SystemEventMap = {
  "system.logged": DomainActionDescriptor<"system", "logged", SystemLoggedData>;
};

export type SystemEventType = keyof SystemEventMap;
export type SystemEventData<T extends SystemEventType> =
  SystemEventMap[T]["data"];

export type SystemOtelAttributesMap = {
  [T in SystemEventType]: Omit<SystemEventMap[T], "data">;
};
