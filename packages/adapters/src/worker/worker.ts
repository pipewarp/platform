import { EventBusPort, QueuePort } from "@pipewarp/ports";
import type { AnyEvent, Capability, WorkerMetadata } from "@pipewarp/types";

// created for each dequeued job; lives until job completes or fails
export type JobContext = {
  id: string;
  tool: string;
  status: "pending" | "running";
  startedAt: number;
  metadata: {}; // flowid, runid, stepid, stepType, etc
  resolved: {}; // resolved dependencies (input files, tokens, session handles)
};

export type WorkerCapability = Capability & {
  newJobWaitersAreAllowed: boolean; // true;
  jobWaiters: Set<Promise<void>>;
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

export class Worker {
  #context: WorkerContext = {
    workerId: "generic-worker",
    totalActiveJobCount: 0,
    capabilities: {},
    jobs: new Map(),
    maxConcurrency: 0,
    isRegistered: false,
  };
  #capabilityJobWaiters = new Map<string, Promise<void>>();

  constructor(
    workerId: string,
    private readonly bus: EventBusPort,
    private readonly queue: QueuePort // emitter facotry - possibly with a bus already buildt in?
  ) {
    this.#context.workerId = workerId;
    // this.#subscribeToBus();
  }

  #subscribeToBus(): void {
    this.bus.subscribe("workers.lifecycle", async (e: AnyEvent) => {
      console.log("[worker] workers.lifecycle event:", e);
      if (e.type === "worker.registered") {
        e = e as AnyEvent<"worker.registered">;
        if (
          e.data.workerId === this.#context.workerId &&
          e.data.status === "accepted"
        ) {
          this.#context.isRegistered = true;
          console.log("[worker] received registration accepted");
        }
      }
    });
  }

  async handleNewJob(event: AnyEvent): Promise<void> {
    // invoke some sort of tool from a tool registry
    const registry = {};
  }

  addCapability(profile: Capability) {
    this.#context.capabilities[profile.name] = {
      ...profile,
      jobWaiters: new Set<Promise<void>>(),
      newJobWaitersAreAllowed: true,
    };
  }
  setCapabilityWaiterPolicy(capabilityId: string, allowNew: boolean) {
    this.#context.capabilities[capabilityId].newJobWaitersAreAllowed = allowNew;
  }
  getWaiterSize(capabilityId: string) {
    return this.#context.capabilities[capabilityId].jobWaiters.size;
  }
  getActiveJobCount(capabilitiesId: string) {}
  getMetadata(): WorkerMetadata {
    const capabilities: Capability[] = [];
    const caps = this.#context.capabilities;

    for (const name in caps) {
      const cap: Capability = {
        name,
        queueId: name,
        activeJobCount: 0,
        maxJobCount: 1,
        tool: {
          ...caps[name].tool,
        },
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
      correlationId: String(crypto.randomUUID()),
      source: "worker://" + this.#context.workerId,
      time: new Date().toISOString(),
      specversion: "1.0",
      datacontenttype: "application/json",
      type: "worker.registration.requested",
      data: meta,
    };
    await this.bus.publish("workers.lifecycle", event);
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
          const event = await this.queue.reserve(
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
        // if we dont await, loop will cycle forever once concurrency limit is met
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
    this.queue.abortAllForWorker(this.#context.workerId);
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
