import { CloudEvent } from "../shared/cloud-event.js";
import { FlowEventType } from "./map.js";

export type FlowScope = {
  flowid: string;
};

export type FlowEvent<T extends FlowEventType> = CloudEvent<T> & FlowScope;
