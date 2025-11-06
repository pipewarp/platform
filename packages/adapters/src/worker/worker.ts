import type {
  EventBusPort,
  QueuePort,
  StreamRegistryPort,
  ToolPort,
} from "@pipewarp/ports";
import { EmitterFactory } from "@pipewarp/events";
import type {
  AnyEvent,
  Capability,
  StepActionCompletedData,
  StepEvent,
  WorkerMetadata,
} from "@pipewarp/types";
import type { ToolClass } from "../tools/tool-factory.js";
import { ToolRegistry } from "../tools/tool-registry.js";
import type { JobContext } from "./types.js";
import { JobExecutor } from "./executor/job-executor.js";
import { interpretJob } from "./interpreter/interpret-job.js";

export type WorkerCapability = Capability & {
  newJobWaitersAreAllowed: boolean;
  jobWaiters: Set<Promise<void>>;
  activeJobCount: number;
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

    this.#subscribeToBus();
  }

  #subscribeToBus(): void {
    this.#bus.subscribe("workers.lifecycle", async (e: AnyEvent) => {
      console.log("[worker] workers.lifecycle event:", e);
      if (e.type === "worker.registered") {
        const event = e as AnyEvent<"worker.registered">;
        if (
          event.data.workerId === this.#context.workerId &&
          event.data.status === "accepted"
        ) {
          this.#context.isRegistered = true;
          console.log("[worker] received registration accepted");
        }
      }
    });
  }

  // may resolve with other factors in the future for multiple tools
  resolveTool(capability: Capability, key?: string): ToolClass {
    return this.#toolRegistry.resolve(capability.tool.id, key);
  }

  async handleNewJob(event: AnyEvent): Promise<void> {
    console.log(`[worker-new] handleNewJob() event: ${event}`);

    const e = event as AnyEvent<"step.mcp.queued">;

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

    const result = await executor.run();

    console.log(`[worker-new] results ${JSON.stringify(result, null, 2)}`);

    this.#emitterFactory.setCloudScope({
      source: "pipewarp://worker",
    });
    this.#emitterFactory.setStepScope({
      flowid: e.flowid,
      runid: e.runid,
      stepid: e.stepid,
    });

    const stepEmitter = this.#emitterFactory.newStepEmitter();

    let data: StepActionCompletedData;
    if (result === undefined) {
      data = {
        ok: false,
        message: "error",
        result: result,
        error: "tool returned undefined",
      };
    } else {
      data = {
        ok: true,
        message: "tool returned results",
        result: result,
      };
    }
    await stepEmitter.emit("step.action.completed", data);
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
    const event: AnyEvent<"worker.registration.requested"> = {
      id: String(crypto.randomUUID()),
      source: "pipewarp://worker/" + this.#context.workerId,
      specversion: "1.0",
      time: new Date().toISOString(),
      type: "worker.registration.requested",
      data: meta,
      domain: "worker",
      action: "requested",
      traceparent: "",
      traceid: "",
      spanid: "",
    };
    await this.#bus.publish("workers.lifecycle", event);
  }

  start(): void {
    for (const id in this.#context.capabilities) {
      const p = this.startCapabilityJobWaiters(id);
      this.#capabilityJobWaiters.set(id, p);
    }
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
    let capacityRelease = this.#makeDeferred<void>();
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
            capacityRelease.resolve();
            capacityRelease = this.#makeDeferred<void>();
          });
          cap.jobWaiters.add(waiter); // later implement graceful shutdown with this
        } catch (err) {
          console.log("[worker] promise did not return job:", err);
          if (!cap.newJobWaitersAreAllowed) break;
          continue;
        }
      } else {
        // if we don't await, loop will cycle forever once concurrency limit is met
        await capacityRelease.promise;
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
