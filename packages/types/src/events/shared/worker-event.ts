import type { WorkerEventType } from "./event-map.js";
import type { CloudEvent } from "./cloud-event.js";

export type WorkerEvent<T extends WorkerEventType> = CloudEvent<T>;
