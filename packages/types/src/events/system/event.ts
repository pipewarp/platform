import { CloudEvent } from "../shared/cloud-event.js";
import { SystemEventType } from "./map.js";

export type SystemScope = {
  flowid?: string;
  runid?: string;
  stepid?: string;
  jobid?: string;
  toolid?: string;
  steptype?: string;
};

export type SystemEvent<T extends SystemEventType> = CloudEvent<T> &
  SystemScope;
// export type SystemEvent = AnySystemEvent<SystemEventType>;
