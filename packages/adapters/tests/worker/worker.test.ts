import { describe, it, expect, vi } from "vitest";
import { EventBusPort, QueuePort } from "@pipewarp/ports";
import { Worker } from "../../src/worker/worker.js";
import { AnyEvent } from "@pipewarp/types";

const reserve = vi.fn();
const queue = {
  reserve,
  abortAllForWorker: vi.fn(),
} as unknown as QueuePort;

const bus = {} as unknown as EventBusPort;

describe("worker", () => {
  it("should stop further waiters from starting when not allowed", async () => {
    const event = {} as AnyEvent;
    const reserve = vi
      .fn()
      .mockResolvedValueOnce(event)
      .mockResolvedValue(null);

    const queue = {
      reserve,
      abortAllForWorker: vi.fn(),
    } as unknown as QueuePort;

    const worker = new Worker(bus, queue);

    const capability = {
      queueId: "qid",
      activeJobCount: 0,
      maxJobCount: 2,
      resource: "res",
      tool: "tool",
      newJobWaitersAreAllowed: true,
      jobWaiters: new Set<Promise<void>>(),
    };

    worker.addCapability("test-c", capability);
    worker.handleNewJob = vi.fn().mockImplementation(async () => {
      capability.newJobWaitersAreAllowed = false;
    });

    await worker.startCapabilityJobWaiters("test-c");

    expect(reserve).toHaveBeenCalledTimes(1);
    expect(capability.activeJobCount).toBe(0);
    expect(capability.jobWaiters.size).toBe(0);
    expect(worker.handleNewJob).toHaveBeenCalledWith(event);
  });

  it("should stop new waiters when not allowed", async () => {
    const event = {} as AnyEvent;
    const reserve = vi.fn().mockResolvedValue(event);

    const queue = {
      reserve,
      abortAllForWorker: vi.fn(),
    } as unknown as QueuePort;

    const worker = new Worker(bus, queue);

    const capability = {
      queueId: "qid",
      activeJobCount: 0,
      maxJobCount: 2,
      resource: "res",
      tool: "tool",
      newJobWaitersAreAllowed: true,
      jobWaiters: new Set<Promise<void>>(),
    };

    worker.addCapability("test-c", capability);
    worker.handleNewJob = vi.fn().mockImplementation(async () => {
      queueMicrotask(() => {
        capability.newJobWaitersAreAllowed = false;
      });
    });

    await worker.startCapabilityJobWaiters("test-c");

    expect(reserve).toHaveBeenCalledTimes(2);
    expect(capability.activeJobCount).toBe(0);
    expect(capability.jobWaiters.size).toBe(0);
    expect(worker.handleNewJob).toHaveBeenCalledWith(event);
  });

  it("busy workers should respect max job concurrency", async () => {
    const event = {} as AnyEvent;
    const reserve = vi.fn().mockResolvedValue(event);

    const queue = {
      reserve,
      abortAllForWorker: vi.fn(),
    } as unknown as QueuePort;

    const worker = new Worker(bus, queue);

    const maxJobCount = 5;
    const capability = {
      queueId: "qid",
      activeJobCount: 0,
      maxJobCount,
      resource: "res",
      tool: "tool",
      newJobWaitersAreAllowed: true,
      jobWaiters: new Set<Promise<void>>(),
    };

    worker.addCapability("test-c", capability);
    worker.handleNewJob = vi.fn().mockImplementation(async () => {
      const p = await new Promise((r) => {
        setTimeout(r, 100);
      });
      return event;
    });

    worker.startCapabilityJobWaiters("test-c");

    await new Promise((r) => {
      setTimeout(r, 10);
    });

    expect(capability.jobWaiters.size).toBe(maxJobCount);
  });
});
