import { describe, it, expect } from "vitest";
import { InMemoryQueue } from "../../src/queue/inmemory.queue.js";
import type { AnyEvent } from "@lcase/types";

describe("InMemoryQueue", () => {
  it("reserve resolves when event is enqueued and empty", async () => {
    const q = new InMemoryQueue();

    const qName = "test-name";
    const workerId = "test-worker";
    const event = { foo: "bar" } as unknown as AnyEvent;

    const promise = q.reserve(qName, workerId);

    expect(await q.peek(qName, 1)).toHaveLength(0);
    await q.enqueue(qName, event);
    await expect(promise).resolves.toBe(event);
    expect(await q.peek(qName, 1)).toEqual([]);
  });

  it("reserve waiters resolves FIFO when events are enqueued", async () => {
    const q = new InMemoryQueue();

    const qName = "test-name";
    const workerId = "test-worker";
    const event1 = { foo: "bar" } as unknown as AnyEvent;
    const event2 = { hello: "world" } as unknown as AnyEvent;
    const event3 = { test: "best" } as unknown as AnyEvent;

    expect(await q.peek(qName, 1)).toHaveLength(0);
    await q.enqueue(qName, event1);
    await q.enqueue(qName, event2);
    await q.enqueue(qName, event3);
    const promise1 = q.reserve(qName, workerId);
    const promise2 = q.reserve(qName, workerId);
    const promise3 = q.reserve(qName, workerId);
    await expect(promise1).resolves.toBe(event1);
    await expect(promise2).resolves.toBe(event2);
    await expect(promise3).resolves.toBe(event3);
    expect(await q.peek(qName, 1)).toHaveLength(0);
  });

  it("peek returns up to N number of items without removing them", async () => {
    const q = new InMemoryQueue();

    const qName = "test-name";
    const workerId = "test-worker";
    const event1 = { foo: "bar" } as unknown as AnyEvent;
    const event2 = { hello: "world" } as unknown as AnyEvent;
    const event3 = { test: "best" } as unknown as AnyEvent;

    expect(await q.peek(qName, 1)).toHaveLength(0);
    await q.enqueue(qName, event1);
    await q.enqueue(qName, event2);
    await q.enqueue(qName, event3);
    expect(await q.peek(qName, 2)).toEqual([event1, event2]);
    expect(await q.peek(qName, 3)).toEqual([event1, event2, event3]);
  });

  it("abortAll resolves reserves null and clears waiters", async () => {
    const q = new InMemoryQueue();

    const qName = "test-name";
    const workerId = "test-worker";
    const promise1 = q.reserve(qName, workerId);
    const promise2 = q.reserve(qName, workerId);

    q.abortAll();

    await expect(promise1).resolves.toBe(null);
    await expect(promise2).resolves.toBe(null);
  });

  it("abortAllForWorker resolves null and removes by workerId", async () => {
    const q = new InMemoryQueue();

    const qName = "test-name";
    const workerId1 = "test-worker1";
    const workerId2 = "test-worker2";
    const event1 = { foo: "bar" } as unknown as AnyEvent;
    const promise1 = q.reserve(qName, workerId1);
    const promise2 = q.reserve(qName, workerId2);

    q.abortAllForWorker(workerId1);
    await expect(promise1).resolves.toBe(null);

    await q.enqueue(qName, event1);
    await expect(promise2).resolves.toBe(event1);
  });
});
