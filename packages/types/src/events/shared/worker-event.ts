import { CloudEvent } from "./cloud-event.js";
import type { WorkerEventType } from "./event-map.js";
import type { PipewarpContext } from "./pipewarp-context.js";

export type WorkerEvent<T extends WorkerEventType> = CloudEvent<T> &
  PipewarpContext;
