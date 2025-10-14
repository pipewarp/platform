import { EventEnvelope, QueuePort } from "@pipewarp/ports";

/**
 * First implementation:
 * No rety; ack and nack are noop
 * FIFO queue as array.  May not scale well
 * Reserve acts as 'dequeue'.  Message lost if worker process fails.
 * No persistance.
 */
export class InMemoryQueue implements QueuePort {
  #queues = new Map<string, EventEnvelope[]>();

  async enqueue(queue: string, event: EventEnvelope): Promise<void> {
    console.log("[inmemory-queue] enqueue() called;");
    const q = this.#queues.get(queue) ?? []; // allow queues to be made on the fly
    q.push(event);
    this.#queues.set(queue, q);
  }

  // NOTE: currently does not 'reserve' but simply 'dequeues'
  async reserve(
    queue: string,
    workerId: string,
    holdMs?: number
  ): Promise<EventEnvelope | null> {
    console.log("[inmemory-queue] reserve() called;");
    const q = this.#queues.get(queue) ?? [];
    if (!q || q.length === 0) return null;

    const event = q.shift();
    if (event === undefined) return null;

    return event;
  }
  ack(queue: string, eventId: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
  nack(queue: string, eventId: string, reason: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async peek(queue: string, number: number): Promise<EventEnvelope[]> {
    const q = this.#queues.get(queue) ?? [];
    return q.slice(0, number);
  }
}
