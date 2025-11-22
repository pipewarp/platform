import type { EventBusPort, RouterPort, QueuePort } from "@lcase/ports";
import { Worker } from "@lcase/worker";
import { FlowStore } from "@lcase/adapters/flow-store";
import { Engine } from "@lcase/engine";
import {
  ConsoleSink,
  ObservabilityTap,
  WebSocketServerSink,
} from "@lcase/observability";
import { EmitterFactory } from "@lcase/events";

export type SinkMap = {
  "console-log-sink"?: ConsoleSink;
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
  ef: EmitterFactory;
};
