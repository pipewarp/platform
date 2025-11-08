// import type { PipewarpContext } from "./pipewarp-context.js";
// import type { StepEventType } from "../event-map.js";
import { CloudEvent } from "./cloud-event.js";

interface StepScope {
  flowid: string;
  runid: string;
  stepid: string;
}

// type StepEvent<T extends StepEventType> = CloudEvent<T> & StepScope;
