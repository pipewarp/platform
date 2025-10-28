import type { CloudEvent } from "./cloud-event.js";
import type { EventType, EventMap } from "./event-map.js";

export interface PipewarpContext<T extends EventType = EventType>
  extends CloudEvent<T> {
  flowId?: string;
  runId?: string;
  stepId?: string;
  taskId?: string;
  stepType?: string;
}
