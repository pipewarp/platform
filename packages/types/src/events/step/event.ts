import type { CloudEvent } from "../shared/cloud-event.js";
import type { StepEventType } from "./map.js";

export type StepScope = {
  flowid: string;
  runid: string;
  stepid: string;
  steptype: string;
};

export type StepEvent<T extends StepEventType> = CloudEvent<T> & StepScope;
