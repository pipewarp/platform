import { EventBusPort, QueuePort } from "@pipewarp/ports";
import { AnyEvent } from "@pipewarp/types";

// created for each dequeued job; lives until job completes or fails
export type JobContext = {
  id: string;
  tool: string;
  status: "pending" | "running";
  startedAt: number;
  metadata: {}; // flowid, runid, stepid, stepType, etc
  resolved: {}; // resolved dependencies (input files, tokens, session handles)
};

export type Capability = {
  queueId: string; //"stt";
  activeJobCount: number; // 0;
  maxJobCount: number; // 1;
  resource: string; // "stt-resource";
  tool: string; // "local-gpu-stt";
  newJobWaitersAreAllowed: boolean; // true;
  jobWaiters: Set<Promise<void>>;
};
export type WorkerContext = {
  workerId: string;
  totalActiveJobCount: number;
  maxConcurrency: number;
  capabilities: {
    // capabilities
    [id: string]: Capability;
  };
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
    workerId: "default-worker",
    totalActiveJobCount: 0,
    capabilities: {},
    jobs: new Map(),
    maxConcurrency: 0,
  };
  #capabilityJobWaiters = new Map<string, Promise<void>>();

  constructor(
    private readonly bus: EventBusPort,
    private readonly queue: QueuePort // emitter facotry - possibly with a bus already buildt in?
  ) {}

  async handleNewJob(event: AnyEvent): Promise<void> {}

  addCapability(id: string, profile: Capability) {
    this.#context.capabilities[id] = profile;
  }
  async start(): Promise<void> {
    for (const id in this.#context.capabilities) {
      const p = this.startCapabilityJobWaiters(id);
      this.#capabilityJobWaiters.set(id, p);
    }
  }
  stop(): void {}

  #makeDeferred<T>(): Deferred<T> {
    let resolve: PromiseResolve<T>;
    let reject: PromiseReject;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    return { promise, resolve: resolve!, reject: reject! };
  }

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
}
