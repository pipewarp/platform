import type {
  BusPlacement,
  BusTransport,
  BusStore,
} from "../registries/bus.registry.js";
import {
  QueuePlacement,
  QueueStore,
  QueueTransport,
} from "../registries/queue.registry.js";

export type BusConfig = {
  id: string;
  placement: BusPlacement;
  transport: BusTransport;
  store: BusStore;
};

export type QueueConfig = {
  id: string;
  placement: QueuePlacement;
  transport: QueueTransport;
  store: QueueStore;
};

export type RouterConfig = {
  id: string;
};

export type EngineConfig = {
  id: string;
};

export type WorkerConfig = {
  id: string;
};
export type StreamConfig = {
  id: string;
};
export type RuntimeConfig = {
  bus: BusConfig;
  queue: QueueConfig;
  router: RouterConfig;
  engine: EngineConfig;
  worker: WorkerConfig;
  stream: StreamConfig;
};
