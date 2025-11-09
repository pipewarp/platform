import { describe, it, expect, vi } from "vitest";
import { EmitterFactory } from "../src/emitter-factory.js";
import { EventBusPort } from "@pipewarp/ports";
import { StepEmitter } from "../src/emitters/step.emitter.js";

describe("emitter factory", () => {
  it("generates a valid trace id", async () => {
    const publish = vi.fn().mockResolvedValue(null);
    const bus = {
      publish,
    } as unknown as EventBusPort;

    const ef = new EmitterFactory(bus);
    const traceId = ef.generateTraceId();

    expect(/^[a-zA-Z0-9]{32}$/.test(traceId)).toBe(true);
  });
  it("generates a valid span id", async () => {
    const publish = vi.fn().mockResolvedValue(null);
    const bus = {
      publish,
    } as unknown as EventBusPort;

    const ef = new EmitterFactory(bus);
    const traceId = ef.generateSpanId();

    expect(/^[a-zA-Z0-9]{16}$/.test(traceId)).toBe(true);
  });

  it("generates a valid trace parent with correct flags", async () => {
    const publish = vi.fn().mockResolvedValue(null);
    const bus = {
      publish,
    } as unknown as EventBusPort;

    const ef = new EmitterFactory(bus);
    const traceId = ef.generateTraceId();
    const spanId = ef.generateSpanId();
    const traceParent = ef.makeTraceParent(traceId, spanId);

    expect(/^00\-[a-zA-Z0-9]{32}\-[a-zA-Z0-9]{16}\-01$/.test(traceParent)).toBe(
      true
    );
    const traceParentTwo = ef.makeTraceParent(traceId, spanId, false);
    expect(
      /^00\-[a-zA-Z0-9]{32}\-[a-zA-Z0-9]{16}\-00$/.test(traceParentTwo)
    ).toBe(true);
  });

  it("starts off with valid otel; no parentSpanId", async () => {
    const publish = vi.fn().mockResolvedValue(null);
    const bus = {
      publish,
    } as unknown as EventBusPort;

    const ef = new EmitterFactory(bus);
    const otel = ef.getOtelContext();

    expect(otel.parentSpanId).toBe(undefined);
    expect(/^[a-zA-Z0-9]{32}$/.test(otel.traceId)).toBe(true);
    expect(/^[a-zA-Z0-9]{16}$/.test(otel.spanId)).toBe(true);
    expect(
      /^00\-[a-zA-Z0-9]{32}-[a-zA-Z0-9]{16}-01$/.test(otel.traceParent)
    ).toBe(true);
  });
  it("does not parent spans for new spans with no parent", async () => {
    const publish = vi.fn().mockResolvedValue(null);
    const bus = {
      publish,
    } as unknown as EventBusPort;

    const ef = new EmitterFactory(bus);
    const otelStart = ef.getOtelContext();
    ef.startSpan({ hasParent: false });
    const otelSecond = ef.getOtelContext();

    expect(otelStart.parentSpanId).toBe(undefined);
    expect(otelSecond.parentSpanId).toBe(undefined);
    expect(otelStart.traceId).toEqual(otelSecond.traceId);
  });
  it("updates otel context with new parent span", async () => {
    const publish = vi.fn().mockResolvedValue(null);
    const bus = {
      publish,
    } as unknown as EventBusPort;

    const ef = new EmitterFactory(bus);
    const otelStart = ef.getOtelContext();
    ef.startSpan({ hasParent: true, parentSpanId: otelStart.spanId });
    const otelSecond = ef.getOtelContext();

    expect(otelStart.parentSpanId).toBe(undefined);
    expect(otelSecond.parentSpanId).toBe(otelStart.spanId);
    expect(otelSecond.spanId).not.toBe(otelStart.spanId);
    expect(otelStart.traceId).toEqual(otelSecond.traceId);
  });
  it("throws error it has a parent but no parent is found", async () => {
    const publish = vi.fn().mockResolvedValue(null);
    const bus = {
      publish,
    } as unknown as EventBusPort;

    const ef = new EmitterFactory(bus);
    expect(ef.hasParent()).toBe(false);
    expect(() => {
      ef.startSpan({ hasParent: true });
    }).toThrow();
  });
});
