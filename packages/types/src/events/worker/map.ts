import {
  DomainActionDescriptor,
  DomainEntityActionDescriptor,
} from "../event-map.js";
import {
  WorkerRegisteredData,
  WorkerRegistrationRequestedData,
  WorkerStartedData,
  WorkerStoppedData,
} from "./data.js";

export type WorkerEventMap = {
  "worker.started": DomainActionDescriptor<
    "worker",
    "started",
    WorkerStartedData
  >;
  "worker.stopped": DomainActionDescriptor<
    "worker",
    "stopped",
    WorkerStoppedData
  >;
  "worker.registration.requested": DomainEntityActionDescriptor<
    "worker",
    "registration",
    "requested",
    WorkerRegistrationRequestedData
  >;
  "worker.registered": DomainActionDescriptor<
    "worker",
    "registered",
    WorkerRegisteredData
  >;
};

export type WorkerEventType = keyof WorkerEventMap;
export type WorkerEventData<T extends WorkerEventType> =
  WorkerEventMap[T]["data"];
export type WorkerOtelAttributesMap = {
  [T in WorkerEventType]: Omit<WorkerEventMap[T], "data">;
};
