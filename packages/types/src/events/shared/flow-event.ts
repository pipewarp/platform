import type { CloudEvent } from "./cloud-event.js";
import type { FlowEventType } from "../event-map.js";

export type FlowScope = {
  flowid: string;
};

export type FlowEvent<T extends FlowEventType> = CloudEvent<T> & FlowScope;
