import type {
  EventBusPort,
  RouterPort,
  QueuePort,
} from "@pipewarp/ports";
import { Worker } from "@pipewarp/adapters/worker";
import { FlowStore } from "@pipewarp/adapters/flow-store";
import { Engine } from "@pipewarp/engine";
import { ConsoleSink, ObservabilityTap, WebSocketServerSink } from "@pipewarp/observability";

export type SinkMap = {
  "console-log-sink"?: ConsoleSink,
  "websocket-sink"?: WebSocketServerSink;
};
export type SinkId = keyof SinkMap;
export type RuntimeContext = {
  queue: QueuePort;
  bus: EventBusPort;
  router: RouterPort;
  engine: Engine;
  worker: Worker;
  flowStore: FlowStore;
  tap: ObservabilityTap;
  sinks: SinkMap;
};
