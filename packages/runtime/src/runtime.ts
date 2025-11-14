import { InMemoryEventBus } from "@pipewarp/adapters/event-bus";
import { InMemoryQueue } from "@pipewarp/adapters/queue";
import { NodeRouter } from "@pipewarp/adapters/router";
import { Worker } from "@pipewarp/adapters/worker";
import { McpTool, ToolFactories, ToolRegistry } from "@pipewarp/adapters/tools";
import { InMemoryStreamRegistry } from "@pipewarp/adapters/stream";
import { FlowStore } from "@pipewarp/adapters/flow-store";
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
import type { RuntimeConfig } from "./types/runtime.config.js";
import type { RuntimeContext } from "./types/runtime.context.js";

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

  // later add observability

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
    emitterFactory
  );

  return {
    queue,
    bus,
    router,
    engine,
    worker,
    flowStore,
  };
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
  emitterFactory: EmitterFactory
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

  return worker;
}
