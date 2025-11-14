import type {
  EventBusPort,
  RouterPort,
  QueuePort,
  EnginePort,
} from "@pipewarp/ports";
import { Worker } from "@pipewarp/adapters/worker";
import { FlowStore } from "@pipewarp/adapters/flow-store";
import { Engine } from "@pipewarp/engine";

export type RuntimeContext = {
  queue: QueuePort;
  bus: EventBusPort;
  router: RouterPort;
  engine: Engine;
  worker: Worker;
  flowStore: FlowStore;
};
