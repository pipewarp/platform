import type { RunEventType } from "./map.js";
import type { RunScope } from "./scope.js";
import type { CloudEvent } from "../shared/cloud-event.js";

export type RunEvent<T extends RunEventType> = CloudEvent<T> & RunScope;
