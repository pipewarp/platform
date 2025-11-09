import { CloudEvent } from "../shared/cloud-event.js";
import { JobEventType } from "./map.js";

export type JobScope = {
  flowid: string;
  runid: string;
  stepid: string;
  jobid: string;
};

export type JobEvent<T extends JobEventType> = CloudEvent<T> & JobScope;
