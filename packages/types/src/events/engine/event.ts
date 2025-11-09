import { CloudEvent } from "../shared/cloud-event.js";
import type { EngineEventType } from "./map.js";

export type EngineScope = {
  engineid: string;
};

export type EngineEvent<T extends EngineEventType> = EngineScope &
  CloudEvent<T>;
