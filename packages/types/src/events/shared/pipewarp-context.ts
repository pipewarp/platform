import type { CloudEvent } from "./cloud-event.js";
import type { EventType, EventMap } from "./event-map.js";

export type PipewarpContext = {
  flowId?: string;
  runId?: string;
  stepId?: string;
  taskId?: string;
  stepType?: string;
};
