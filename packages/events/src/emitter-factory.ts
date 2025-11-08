import type { EventBusPort } from "@pipewarp/ports";
import type { StepScope, CloudScope, FlowScope } from "@pipewarp/types";
import { StepEmitter } from "./emitters/step.emitter.js";
import { FlowEmitter } from "./emitters/flow.emitter.js";
import { OtelContext } from "./types.js";
import { randomBytes } from "crypto";

/**
 * Create emitter objects based upon a common scope.
 *
 * Set scope in init(scope)
 *
 * Create emitter objects with respective emitter function.
 *
 * @param bus EventBusPort
 *
 * @member setScope(scope: BaseScope): void
 * @member newStepEmitter(): StepEmitter
 *
 * @example
 * ```
 * const emitterFactory = new EmitterFactory();
 * emitterFactory.setScope({...}: BaseScope)
 * const stepEmitter = newStepEmitter(type, stepType, data);
 * await stepEmitter.emit(data);
 *
 */

export class EmitterFactory {
  #cloudScope?: CloudScope;
  #stepScope?: StepScope;
  #otel: OtelContext = {
    spanId: "",
    traceId: "",
    traceParent: "",
    parentSpanId: undefined,
  };

  constructor(private readonly bus: EventBusPort) {
    this.startTrace();
  }

  setCloudScope(scope: CloudScope) {
    this.#cloudScope = scope;
  }
  setStepScope(scope: StepScope) {
    this.#stepScope = scope;
  }

  newFlowEmitter(scope: CloudScope & FlowScope & OtelContext): FlowEmitter {
    return new FlowEmitter(this.bus, scope);
  }

  newStepEmitter(): StepEmitter {
    if (!this.#cloudScope) {
      throw new Error("[emitter-factory] no cloud scope set");
    }
    if (!this.#stepScope) {
      throw new Error("[emitter-factory] no step scope set");
    }

    return new StepEmitter(
      this.bus,
      this.#otel,
      this.#stepScope,
      this.#cloudScope
    );
  }

  startTrace(sampled = true): OtelContext {
    const traceId = this.generateTraceId();
    const spanId = this.generateSpanId();
    const traceParent = this.makeTraceParent(traceId, spanId, sampled);

    this.#otel.traceId = traceId;
    this.#otel.spanId = spanId;
    this.#otel.traceParent = traceParent;
    this.#otel.parentSpanId = undefined;
    return this.#otel;
  }

  setParentSpanId(parentSpanId: string) {
    this.#otel.parentSpanId = parentSpanId;
  }

  getOtelContext(): OtelContext {
    return { ...this.#otel };
  }

  startSpan({
    hasParent = true,
    parentSpanId,
  }: {
    hasParent?: boolean;
    parentSpanId?: string;
  }) {
    if (parentSpanId && hasParent) {
      this.setParentSpanId(parentSpanId);
    } else if (!this.#otel.parentSpanId && hasParent) {
      throw new Error("[emitter-factory] no parent span declared");
    } else {
      this.#otel.parentSpanId = undefined;
    }
    this.#otel.spanId = this.generateSpanId();
    this.#otel.traceParent = this.makeTraceParent(
      this.#otel.traceId,
      this.#otel.spanId
    );
  }
  hasParent(): boolean {
    return this.#otel.parentSpanId ? true : false;
  }

  makeTraceParent(traceId: string, spanId: string, sampled = true): string {
    const version = "00";
    const flags = sampled ? "01" : "00";
    const traceParent = `${version}-${traceId}-${spanId}-${flags}`;
    console.log(traceParent);
    return traceParent;
  }
  generateTraceId(): string {
    let id = "";
    do {
      id = randomBytes(16).toString("hex"); // 32 hex characters
    } while (/^0+$/.test(id)); // try again if all zeros
    return id;
  }

  generateSpanId() {
    let id = "";
    do {
      id = randomBytes(8).toString("hex"); // 16 hex characters
    } while (/^0+$/.test(id)); // try again if all zeros
    return id;
  }
}
