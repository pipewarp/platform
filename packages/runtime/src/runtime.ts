
import { InMemoryQueue } from "@pipewarp/adapters/queue";
import { NodeRouter } from "@pipewarp/adapters/router";
import { Worker } from "@pipewarp/adapters/worker";
import { McpTool, ToolFactories, ToolRegistry } from "@pipewarp/adapters/tools";
import { InMemoryStreamRegistry } from "@pipewarp/adapters/stream";
import { FlowStore, FlowStoreFs } from "@pipewarp/adapters/flow-store";
import {
  Engine,
  PipeResolver,
  resolveStepArgs,
  ResourceRegistry,
  wireStepHandlers,
} from "@pipewarp/engine";

import { EmitterFactory } from "@pipewarp/events";
import { EventBusPort, StreamRegistryPort } from "@pipewarp/ports";
import {
  makeBusFactory,
  makeQueueFactory,
} from "./factories/registry.factory.js";
import type { ObservabilityConfig, RuntimeConfig, WorkerConfig } from "./types/runtime.config.js";
import type { RuntimeContext, SinkMap } from "./types/runtime.context.js";
import { ConsoleSink, ObservabilityTap, WebSocketServerSink } from "@pipewarp/observability";
import { WorkflowRuntime } from "./workflow.runtime.js";
import { FlowService } from "@pipewarp/services";



export function createRuntime(config: RuntimeConfig): WorkflowRuntime { 
  const ctx = makeRuntimeContext(config);

  const ef = new EmitterFactory(ctx.bus);

  const flowService = new FlowService(ctx.bus, ef, new FlowStoreFs());
  const runtime = new WorkflowRuntime(ctx, { flowService });
  return runtime;
}

export function makeRuntimeContext(config: RuntimeConfig): RuntimeContext {
  const busFactory = makeBusFactory(
    config.bus.placement,
    config.bus.transport,
    config.bus.store
  );

  const bus = busFactory();

  const queueFactory = makeQueueFactory(
    config.queue.placement,
    config.queue.transport,
    config.queue.store
  );
  const queue = queueFactory();

  const router = new NodeRouter(bus, queue);
  const streamRegistry = new InMemoryStreamRegistry();
  const emitterFactory = new EmitterFactory(bus);
  const flowStore = new FlowStore();

  const engine = createInProcessEngine(
    flowStore,
    bus,
    streamRegistry,
    emitterFactory
  );
  const worker = createInProcessWorker(
    config.worker.id,
    bus,
    queue,
    streamRegistry,
    emitterFactory,
    config.worker,
  );

  const {tap, sinks} = createObservability(config.observability, bus);

  return {
    queue,
    bus,
    router,
    engine,
    worker,
    flowStore,
    tap,
    sinks,
  };
}



export function createObservability(config: ObservabilityConfig, bus: EventBusPort): { tap: ObservabilityTap, sinks: SinkMap } {
  const tap = new ObservabilityTap(bus);
  const sinks: SinkMap = {};
  if (config.sinks) {
    for (const sink of config.sinks) {
      switch (sink) {
        case "console-log-sink":
          const consoleSink = new ConsoleSink();
          sinks["console-log-sink"] = consoleSink
          tap.attachSink(consoleSink);
          break;
        case "websocket-sink":
          if (config.webSocketPort !== undefined) {
            const webSocketServerSink = new WebSocketServerSink(config.webSocketPort);
            sinks["websocket-sink"] = webSocketServerSink
            tap.attachSink(webSocketServerSink);
          }
          break;
        default: break;
      }
    }
  }
  return {tap, sinks}
}

export function createInProcessEngine(
  flowDb: FlowStore,
  bus: EventBusPort,
  streamRegistry: StreamRegistryPort,
  emitterFactory: EmitterFactory
): Engine {
  const pipeResolver = new PipeResolver(streamRegistry);
  const stepHandlerRegistry = wireStepHandlers(resolveStepArgs, pipeResolver);
  const resourceRegistry = new ResourceRegistry();

  const engine = new Engine(
    flowDb,
    bus,
    streamRegistry,
    stepHandlerRegistry,
    resourceRegistry,
    emitterFactory
  );

  return engine;
}

export function createInProcessWorker(
  id: string,
  bus: EventBusPort,
  queue: InMemoryQueue,
  streamRegistry: StreamRegistryPort,
  emitterFactory: EmitterFactory,
  config: WorkerConfig
): Worker {
  const toolFactories: ToolFactories = {
    mcp: () => new McpTool(),
  };
  const toolRegistry = new ToolRegistry(toolFactories);
  const worker = new Worker(id, {
    bus,
    emitterFactory,
    queue,
    streamRegistry,
    toolRegistry,
  });

  for (const cap of config.capabilities) {
    worker.addCapability(cap);
  }

  return worker;
}
