import { describe, it, expect, vi } from "vitest";
import { EventBusPort, QueuePort, StreamRegistryPort } from "@pipewarp/ports";
import { Worker, type WorkerCapability } from "../../src/worker/worker.js";
import type { AnyEvent, Capability } from "@pipewarp/types";
import { EmitterFactory } from "@pipewarp/events";
import { ToolRegistry } from "../../src/tools/tool-registry.js";

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

    const worker = new Worker("workerId", {
      bus,
      queue,
      emitterFactory: {} as EmitterFactory,
      streamRegistry: {} as StreamRegistryPort,
      toolRegistry: {} as ToolRegistry,
    });

    const maxJobCount = 5;
    const capId = "test-c";

    const capability: Capability = {
      name: capId,
      queueId: "qid",
      maxJobCount: maxJobCount,
      tool: {
        id: "mcp",
        type: "inprocess",
      },
    };

    worker.addCapability(capability);
    worker.handleNewJob = vi.fn().mockImplementation(async () => {
      worker.setCapabilityWaiterPolicy(capId, false);
    });

    await worker.startCapabilityJobWaiters(capId);

    expect(reserve).toHaveBeenCalledTimes(1);
    expect(worker.getCapabilityActiveJobCount(capId)).toBe(0);
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

    const worker = new Worker("workerId", {
      bus,
      queue,
      emitterFactory: {} as EmitterFactory,
      streamRegistry: {} as StreamRegistryPort,
      toolRegistry: {} as ToolRegistry,
    });

    const maxJobCount = 5;
    const capId = "test-c";
    const capability: Capability = {
      name: capId,
      queueId: "qid",
      maxJobCount: maxJobCount,
      tool: {
        id: "mcp",
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
    expect(worker.getCapabilityActiveJobCount(capId)).toBe(0);
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

    const worker = new Worker("workerId", {
      bus,
      queue,
      emitterFactory: {} as EmitterFactory,
      streamRegistry: {} as StreamRegistryPort,
      toolRegistry: {} as ToolRegistry,
    });

    const maxJobCount = 5;
    const capId = "test-c";
    const capability: Capability = {
      name: capId,
      queueId: "qid",
      maxJobCount: maxJobCount,
      tool: {
        id: "mcp",
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
