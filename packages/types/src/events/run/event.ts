import type { RunEventType } from "./map.js";
import type { CloudEvent } from "../shared/cloud-event.js";

export type RunScope = {
  flowid: string;
  runid: string;
};

export type RunEvent<T extends RunEventType> = CloudEvent<T> & RunScope;
