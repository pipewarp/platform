import type { EventBusPort } from "@pipewarp/ports";
import type {
  StepScope,
  CloudScope,
  FlowScope,
  EngineScope,
  RunScope,
  JobScope,
  ToolScope,
  WorkerScope,
} from "@pipewarp/types";
import { StepEmitter } from "./emitters/step.emitter.js";
import { FlowEmitter } from "./emitters/flow.emitter.js";
import { OtelContext } from "./types.js";
import { randomBytes } from "crypto";
import { EngineEmitter } from "./emitters/engine.emitter.js";
import { RunEmitter } from "./emitters/run.emitter.js";
import { JobEmitter } from "./emitters/jobs.emitter.js";
import { ToolEmitter } from "./emitters/tool.emitter.js";
import { WorkerEmitter } from "./emitters/worker.emitter.js";

/**
 * NOTE: This class is currently in between being refactored.
 *
 * In order to preserve momentum on bootstrapping Observability,
 * this class is staying unfinished.
 *
 * Scopes, Shared Context Otel Features, Dependency Injection, and other issues will
 * be refactored in the future to allow easier otel creation, proper DI,
 * better DX for emitter creation and usage, and simplified types.
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
 * const stepEmitter = newStepEmitter({...});
 * await stepEmitter.emit("event.type", data);
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

  newEngineEmitter(
    scope: CloudScope & EngineScope & OtelContext
  ): EngineEmitter {
    return new EngineEmitter(this.bus, scope);
  }
  newWorkerEmitter(
    scope: CloudScope & WorkerScope & OtelContext
  ): WorkerEmitter {
    return new WorkerEmitter(this.bus, scope);
  }

  newFlowEmitter(scope: CloudScope & FlowScope & OtelContext): FlowEmitter {
    return new FlowEmitter(this.bus, scope);
  }
  newRunEmitter(scope: CloudScope & RunScope & OtelContext): RunEmitter {
    return new RunEmitter(this.bus, scope);
  }

  newStepEmitter(scope: CloudScope & StepScope & OtelContext): StepEmitter {
    return new StepEmitter(this.bus, scope);
  }
  newJobEmitter(scope: CloudScope & JobScope & OtelContext): JobEmitter {
    return new JobEmitter(this.bus, scope);
  }
  newToolEmitter(scope: CloudScope & ToolScope & OtelContext): ToolEmitter {
    return new ToolEmitter(this.bus, scope);
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
