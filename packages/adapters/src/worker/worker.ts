import type {
  EventBusPort,
  QueuePort,
  StreamRegistryPort,
  ToolPort,
} from "@lcase/ports";
import { EmitterFactory } from "@lcase/events";
import type { AnyEvent, Capability, WorkerMetadata } from "@lcase/types";
import type { ToolClass } from "../tools/tool-factory.js";
import { ToolRegistry } from "../tools/tool-registry.js";
import type { JobContext } from "./types.js";
import { JobExecutor } from "./executor/job-executor.js";
import { interpretJob } from "./interpreter/interpret-job.js";

export type WorkerCapability = Capability & {
  newJobWaitersAreAllowed: boolean;
  jobWaiters: Set<Promise<void>>;
  activeJobCount: number;
  capacityRelease?: Deferred<void>;
};
export type WorkerContext = {
  workerId: string;
  totalActiveJobCount: number;
  maxConcurrency: number;
  capabilities: {
    // capabilities
    [id: string]: WorkerCapability;
  };
  isRegistered: boolean;
  jobs: Map<string, JobContext>;
};

type PromiseResolve<T> = (value: T | PromiseLike<T>) => void;
type PromiseReject = (r?: unknown) => void;
type Deferred<T> = {
  promise: Promise<T>;
  resolve: PromiseResolve<T>;
  reject: PromiseReject;
};

export type WorkerDeps = {
  bus: EventBusPort;
  queue: QueuePort;
  toolRegistry: ToolRegistry;
  emitterFactory: EmitterFactory;
  streamRegistry: StreamRegistryPort;
};

export class Worker {
  #context: WorkerContext = {
    workerId: "generic-worker",
    totalActiveJobCount: 0,
    capabilities: {},
    jobs: new Map(),
    maxConcurrency: 1,
    isRegistered: false,
  };
  #capabilityJobWaiters = new Map<string, Promise<void>>();
  #tools = new Map<string, ToolPort>();

  // DI deps
  #bus;
  #queue;
  #toolRegistry;
  #emitterFactory;
  #streamRegistry;

  constructor(workerId: string, deps: WorkerDeps) {
    this.#context.workerId = workerId;
    this.#bus = deps.bus;
    this.#queue = deps.queue;
    this.#toolRegistry = deps.toolRegistry;
    this.#emitterFactory = deps.emitterFactory;
    this.#streamRegistry = deps.streamRegistry;
  }

  #subscribeToBus(): void {
    this.#bus.subscribe("workers.lifecycle", async (e: AnyEvent) => {
      if (e.type === "worker.registered") {
        const event = e as AnyEvent<"worker.registered">;
        if (
          event.data.workerId === this.#context.workerId &&
          event.data.status === "accepted"
        ) {
          this.#context.isRegistered = true;
          const spanId = this.#emitterFactory.generateSpanId();
          const traceParent = this.#emitterFactory.makeTraceParent(
            e.traceid,
            spanId
          );
          const logEmitter = this.#emitterFactory.newSystemEmitter({
            source: "lowercase://engine/subscribe-to-bus",
            traceId: e.traceid,
            spanId,
            traceParent,
          });
          await logEmitter.emit("system.logged", {
            log: "[worker] received registration accepted",
          });
        }
      }
    });
  }

  // may resolve with other factors in the future for multiple tools
  resolveTool(capability: Capability, key?: string): ToolClass {
    return this.#toolRegistry.resolve(capability.tool.id, key);
  }

  async handleNewJob(event: AnyEvent): Promise<void> {
    const e = event as AnyEvent<"job.mcp.queued">;

    // invoke some sort of tool from a tool registry
    const jobDescription = interpretJob(event);
    const jobContext: JobContext = {
      id: jobDescription.id,
      capability: jobDescription.capability,
      metadata: {
        flowId: e.flowid,
        runId: e.runid,
        stepId: e.stepid,
        stepType: e.entity!,
        workerId: this.#context.workerId,
      },
      description: jobDescription,
      resolved: {},
      status: "preparing",
      startedAt: new Date().toISOString(),
      tool: jobDescription.capability,
    };
    this.#context.jobs.set(jobContext.id, jobContext);

    const executor = new JobExecutor(jobContext, {
      toolRegistry: this.#toolRegistry,
      streamRegistry: this.#streamRegistry,
    });

    const toolSpanId = this.#emitterFactory.generateSpanId();
    const toolTraceParent = this.#emitterFactory.makeTraceParent(
      e.traceid,
      toolSpanId
    );
    const toolEmitter = this.#emitterFactory.newToolEmitter({
      source: "lowercase://worker/job-done",
      flowid: e.flowid,
      runid: e.runid,
      stepid: e.stepid,
      jobid: e.jobid,
      toolid: jobContext.tool,
      traceId: e.traceid,
      spanId: toolSpanId,
      traceParent: toolTraceParent,
    });

    await toolEmitter.emit("tool.started", {
      tool: {
        id: jobContext.tool,
        name: "unknown",
        version: "unknown",
      },
      log: "about to execute a tool",
      status: "started",
    });
    const result = await executor.run();

    const spanId = this.#emitterFactory.generateSpanId();
    const traceParent = this.#emitterFactory.makeTraceParent(e.traceid, spanId);

    const jobEmitter = this.#emitterFactory.newJobEmitter({
      source: "lowercase://worker/job-done",
      flowid: e.flowid,
      runid: e.runid,
      stepid: e.stepid,
      jobid: e.jobid,
      traceId: e.traceid,
      spanId,
      traceParent,
    });

    if (result) {
      await jobEmitter.emit("job.completed", {
        job: {
          id: e.jobid,
          capability: e.data.job.capability,
        },
        status: "completed",
        result: result,
      });
    } else {
      await jobEmitter.emit("job.failed", {
        job: {
          id: e.jobid,
          capability: e.data.job.capability,
        },
        status: "failed",
        reason: "tool returned undefined results",
      });
    }
  }

  addCapability(profile: Capability) {
    this.#context.capabilities[profile.name] = {
      ...profile,
      jobWaiters: new Set<Promise<void>>(),
      newJobWaitersAreAllowed: true,
      activeJobCount: 0,
    };
  }
  setCapabilityWaiterPolicy(capabilityId: string, allowNew: boolean) {
    this.#context.capabilities[capabilityId].newJobWaitersAreAllowed = allowNew;
  }
  getWaiterSize(capabilityId: string) {
    return this.#context.capabilities[capabilityId].jobWaiters.size;
  }
  getCapabilityActiveJobCount(capabilityId: string): number | undefined {
    return this.#context.capabilities[capabilityId].activeJobCount;
  }
  getMetadata(): WorkerMetadata {
    const capabilities: Capability[] = [];
    const caps = this.#context.capabilities;

    // strip some fields from context and create new objects
    for (const id in caps) {
      const cap: Capability = {
        name: caps[id].name,
        queueId: caps[id].queueId,
        maxJobCount: caps[id].maxJobCount,
        tool: { ...caps[id].tool },
      };
      capabilities.push(cap);
    }
    const meta: WorkerMetadata = {
      id: this.#context.workerId,
      name: this.#context.workerId,
      type: "inprocess",
      capabilities,
    };
    return meta;
  }

  async requestRegistration(): Promise<void> {
    const meta = this.getMetadata();

    const spanId = this.#emitterFactory.generateSpanId();
    const traceId = this.#emitterFactory.generateTraceId();
    const traceParent = this.#emitterFactory.makeTraceParent(traceId, spanId);

    const workerEmitter = this.#emitterFactory.newWorkerEmitter({
      source: "lowercase://worker/" + this.#context.workerId,
      workerid: this.#context.workerId,
      traceId,
      spanId,
      traceParent,
    });

    await workerEmitter.emit("worker.registration.requested", {
      worker: {
        id: meta.id,
      },
      id: meta.id,
      name: meta.name,
      type: "inprocess",
      capabilities: meta.capabilities,
    });
  }

  async start(): Promise<void> {
    this.#subscribeToBus();
    for (const id in this.#context.capabilities) {
      const p = this.startCapabilityJobWaiters(id);
      this.#capabilityJobWaiters.set(id, p);
    }
    const spanId = this.#emitterFactory.generateSpanId();
    const traceId = this.#emitterFactory.generateTraceId();
    const traceParent = this.#emitterFactory.makeTraceParent(traceId, spanId);

    const workerEmitter = this.#emitterFactory.newWorkerEmitter({
      source: "lowercase://worker/start",
      workerid: this.#context.workerId,
      traceId,
      spanId,
      traceParent,
    });

    await workerEmitter.emit("worker.started", {
      worker: {
        id: this.#context.workerId,
      },
      status: "started",
    });
  }
  stop(): void {}

  /**
   * Start job waiters (deferred promises) on a queue.
   *
   * When a job waiter gets a job (deferred promised is resolved), then
   * make a new job waiter up to the max concurrency defined in the
   * worker context for this capability.
   *
   * Set newJobWatersAreAllowed = false to stop new waiters from being
   * created;
   *
   * @see WorkerContext for more on where that property exists.
   *
   * @param capabilityId id of the capability to start job waiters for
   */
  async startCapabilityJobWaiters(capabilityId: string): Promise<void> {
    const cap = this.#context.capabilities[capabilityId];
    cap.newJobWaitersAreAllowed = true;
    while (cap.newJobWaitersAreAllowed) {
      if (cap.activeJobCount < cap.maxJobCount) {
        try {
          const event = await this.#queue.reserve(
            cap.queueId,
            this.#context.workerId
          );

          // TODO: change queue from null to rejected?
          if (event === null) {
            if (!cap.newJobWaitersAreAllowed) break;
            continue;
          }
          cap.activeJobCount++;
          const waiter = this.handleNewJob(event).finally(async () => {
            cap.jobWaiters.delete(waiter);
            cap.activeJobCount--;
            if (cap.capacityRelease) {
              cap.capacityRelease.resolve();
            }
          });
          cap.jobWaiters.add(waiter); // later implement graceful shutdown with this
        } catch (err) {
          if (!cap.newJobWaitersAreAllowed) break;
          continue;
        }
      } else {
        cap.capacityRelease = this.#makeDeferred<void>();
        await cap.capacityRelease.promise;
      }
    }
  }

  /**
   * Stops all job waiters in the queue and marks each capability to stop
   * new job waiters.
   */
  async stopAllJobWaiters() {
    const caps = this.#context.capabilities;
    // need to stop each capability from making new ones first
    for (const id in caps) {
      caps[id].newJobWaitersAreAllowed = false;
      caps[id].jobWaiters.clear();
      caps[id].activeJobCount = 0;
      if (caps[id].capacityRelease) caps[id].capacityRelease.resolve();
    }
    this.#queue.abortAllForWorker(this.#context.workerId);
  }

  #makeDeferred<T>(): Deferred<T> {
    let resolve: PromiseResolve<T>;
    let reject: PromiseReject;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    return { promise, resolve: resolve!, reject: reject! };
  }
}
