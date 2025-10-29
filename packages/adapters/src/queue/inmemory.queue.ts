import { QueuePort } from "@pipewarp/ports";
import type { AnyEvent } from "@pipewarp/types";

/**
 * First implementation:
 * No rety; ack and nack are noop
 * FIFO queue as array.  May not scale well
 * Reserve now acts as a dequeue but uses promise resolution to prevent resovling
 * until something is in the queue.  This way, consumers of the queue do not need
 * to poll.
 * No persistance.
 */
export class InMemoryQueue implements QueuePort {
  #queues = new Map<string, AnyEvent[]>();
  #waiters = new Map<string, Array<(e: AnyEvent) => void>>();

  async enqueue(queue: string, event: AnyEvent): Promise<void> {
    const q = this.#queues.get(queue) ?? []; // allow queues to be made on the fly
    const w = this.#waiters.get(queue) ?? [];

    // if waiters are waiting on this queue, just send it to that directly now
    if (w.length > 0) {
      const cb = w.shift();
      if (cb !== undefined) cb(event); // call resolve method on this waiter
    } else {
      q.push(event);
    }
    this.#queues.set(queue, q);
  }

  async reserve(
    queue: string,
    workerId?: string,
    holdMs?: number
  ): Promise<AnyEvent> {
    const q = this.#queues.get(queue) ?? [];

    // quick fullfilled promise if queue is not empty
    if (q.length > 0) return q.shift()!;
    // nothing in queue, return a promise we resolve later in this.enqueue()
    return new Promise<AnyEvent>((resolve, reject) => {
      const waiterResolvers = this.#waiters.get(queue) ?? [];

      waiterResolvers.push((e: AnyEvent) => {
        resolve(e);
      });
      this.#waiters.set(queue, waiterResolvers);
    });
  }
  ack(queue: string, eventId: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
  nack(queue: string, eventId: string, reason: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async peek(queue: string, number: number): Promise<AnyEvent[]> {
    const q = this.#queues.get(queue) ?? [];
    return q.slice(0, number);
  }

  // gracefully shut down and resolve any promises for clean process exit
  abortAll(): void {
    for (const [queue, resolvers] of this.#waiters.entries()) {
      for (const resolver of resolvers) {
        resolver(null as any);
      }
    }
    this.#waiters.clear();
    console.log("[inmemory-queue] all waiters resolved null and removed.");
  }
}
