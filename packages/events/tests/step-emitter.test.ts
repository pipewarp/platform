import { describe, it, expect, vi } from "vitest";
import { StepEmitter } from "../src/step-emitter.js";
import { EventBusPort } from "@pipewarp/ports";
import { AnyEvent } from "@pipewarp/types";
import { afterEach } from "node:test";
import { registry } from "../src/event-registry.js";
describe("[step-emitter]", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("produces a valid event for a given context", () => {
    const publish = vi.fn().mockResolvedValue(null);
    const bus = {
      publish,
    } as unknown as EventBusPort;

    const testTime = "test-time";
    const testId = "test-id";
    vi.spyOn(crypto, "randomUUID").mockReturnValue(testId as any);
    vi.spyOn(Date.prototype, "toISOString").mockReturnValue(testTime);

    const event: AnyEvent<"step.action.completed"> = {
      spanid: "test-spanid",
      traceid: "test-traceid",
      traceparent: "test-traceparent",
      parentspanid: "test-parentspanid",
      flowid: "test-flowid",
      runid: "test-runid",
      stepid: "test-stepid",
      source: "test-source",
      domain: "step",
      entity: "action",
      action: "completed",
      data: {
        ok: false,
        message: "test-message",
      },
      specversion: "1.0",
      type: "step.action.completed",
      id: testId,
      time: testTime,
    };
    const emitter = new StepEmitter(
      bus,
      {
        spanId: event.spanid,
        traceId: event.traceid,
        traceParent: event.traceparent,
        parentSpanId: event.parentspanid,
      },
      {
        flowid: event.flowid,
        runid: event.runid,
        stepid: event.stepid,
      },
      {
        source: event.source,
      }
    );

    emitter.emit("step.action.completed", {
      ok: event.data.ok,
      message: event.data.message,
    });

    expect(publish).toHaveBeenCalledOnce();
    expect(publish).toHaveBeenCalledWith(
      registry["step.action.completed"].topic,
      event
    );
  });
});
