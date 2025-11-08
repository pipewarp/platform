import { CloudEvent } from "../shared/cloud-event.js";
import type { EngineScope } from "./scope.js";
import type { EngineEventType } from "./map.js";

export type EngineEvent<T extends EngineEventType> = EngineScope &
  CloudEvent<T>;
