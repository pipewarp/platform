import { describe, it, expect, vi } from "vitest";
import { EventBusPort, QueuePort } from "@pipewarp/ports";
import { Worker, type WorkerCapability } from "../../src/worker/worker.js";
import type { AnyEvent, Capability } from "@pipewarp/types";
import { subscribe } from "diagnostics_channel";

const bus = {
  subscribe: async () => {
    return;
  },
} as unknown as EventBusPort;

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

    const worker = new Worker("workerId", bus, queue);

    const capId = "test-c";
    const capability: Capability = {
      name: capId,
      queueId: "qid",
      activeJobCount: 0,
      maxJobCount: 2,
      tool: {
        id: "id",
        type: "inprocess",
      },
    };

    worker.addCapability(capability);
    worker.handleNewJob = vi.fn().mockImplementation(async () => {
      worker.setCapabilityWaiterPolicy(capId, false);
    });

    await worker.startCapabilityJobWaiters(capId);

    expect(reserve).toHaveBeenCalledTimes(1);
    expect(capability.activeJobCount).toBe(0);
    expect(worker.getWaiterSize(capId)).toBe(0);
    expect(worker.handleNewJob).toHaveBeenCalledWith(event);
  });

  it("should stop new waiters when not allowed", async () => {
    const event = {} as AnyEvent;
    const reserve = vi.fn().mockResolvedValue(event);

    const queue = {
      reserve,
      abortAllForWorker: vi.fn(),
    } as unknown as QueuePort;

    const worker = new Worker("workerId", bus, queue);

    const capId = "test-c";
    const capability: Capability = {
      name: "test-c",
      queueId: "qid",
      activeJobCount: 0,
      maxJobCount: 2,
      tool: {
        id: "id",
        type: "inprocess",
      },
    };

    worker.addCapability(capability);
    worker.handleNewJob = vi.fn().mockImplementation(async () => {
      queueMicrotask(() => {
        worker.setCapabilityWaiterPolicy(capId, false);
      });
    });

    await worker.startCapabilityJobWaiters(capId);

    expect(reserve).toHaveBeenCalledTimes(2);
    expect(capability.activeJobCount).toBe(0);
    expect(worker.getWaiterSize(capId)).toBe(0);
    expect(worker.handleNewJob).toHaveBeenCalledWith(event);
  });

  it("busy workers should respect max job concurrency", async () => {
    const event = {} as AnyEvent;
    const reserve = vi.fn().mockResolvedValue(event);

    const queue = {
      reserve,
      abortAllForWorker: vi.fn(),
    } as unknown as QueuePort;

    const worker = new Worker("workerId", bus, queue);

    const maxJobCount = 5;
    const capId = "test-c";
    const capability: Capability = {
      name: capId,
      queueId: "qid",
      activeJobCount: 0,
      maxJobCount: maxJobCount,
      tool: {
        id: "id",
        type: "inprocess",
      },
    };

    worker.addCapability(capability);
    worker.handleNewJob = vi.fn().mockImplementation(async () => {
      const p = await new Promise((r) => {
        setTimeout(r, 20);
      });
      return event;
    });

    worker.startCapabilityJobWaiters(capId);

    await new Promise((r) => {
      setTimeout(r, 10);
    });

    expect(worker.getWaiterSize(capId)).toBe(maxJobCount);
    worker.setCapabilityWaiterPolicy(capId, false);
  });
});
