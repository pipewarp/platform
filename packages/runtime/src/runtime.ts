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

export type InProcessRuntimeContext = {
  queue: InMemoryQueue;
  bus: InMemoryEventBus;
  router: NodeRouter;
  engine: Engine;
  worker: Worker;
  flowStore: FlowStore;
};

export function createInProcessRuntimeContext(): InProcessRuntimeContext {
  const queue = new InMemoryQueue();
  const bus = new InMemoryEventBus();
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
    bus,
    queue,
    streamRegistry,
    emitterFactory
  );

  return { queue, bus, router, engine, worker, flowStore };
}

export function startInProcessRuntime(ctx: InProcessRuntimeContext) {}

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
  bus: EventBusPort,
  queue: InMemoryQueue,
  streamRegistry: StreamRegistryPort,
  emitterFactory: EmitterFactory
): Worker {
  const toolFactories: ToolFactories = {
    mcp: () => new McpTool(),
  };
  const toolRegistry = new ToolRegistry(toolFactories);
  const worker = new Worker("default-worker", {
    bus,
    emitterFactory,
    queue,
    streamRegistry,
    toolRegistry,
  });

  return worker;
}
