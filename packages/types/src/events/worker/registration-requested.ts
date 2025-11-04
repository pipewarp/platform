import type { WorkerEvent } from "../shared/worker-event.js";
import type { WorkerMetadata } from "../../worker.types.js";

export type WorkerRegistrationRequestedData = WorkerMetadata;

export type WorkerRegistionRequested =
  WorkerEvent<"worker.registration.requested">;
