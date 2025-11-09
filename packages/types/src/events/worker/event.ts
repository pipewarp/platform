import { CloudEvent } from "../shared/cloud-event.js";
import { WorkerEventType } from "./map.js";

export type WorkerScope = {
  workerid: string;
};

export type WorkerEvent<T extends WorkerEventType> = CloudEvent<T> &
  WorkerScope;
