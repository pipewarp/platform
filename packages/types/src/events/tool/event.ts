import { JobScope } from "../job/event.js";
import { CloudEvent } from "../shared/cloud-event.js";
import { ToolEventType } from "./map.js";

export type ToolScope = JobScope & {
  toolid: string;
};

export type ToolEvent<T extends ToolEventType> = CloudEvent<T> & ToolScope;
