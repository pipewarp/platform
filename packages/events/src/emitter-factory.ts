import type { EventBusPort } from "@lcase/ports";
import type {
  StepScope,
  CloudScope,
  FlowScope,
  EngineScope,
  RunScope,
  JobScope,
  ToolScope,
  WorkerScope,
  SystemScope,
  AllJobEvents,
} from "@lcase/types";
import { StepEmitter } from "./emitters/step.emitter.js";
import { FlowEmitter } from "./emitters/flow.emitter.js";
import { OtelContext } from "./types.js";
import { randomBytes } from "crypto";
import { EngineEmitter } from "./emitters/engine.emitter.js";
import { RunEmitter } from "./emitters/run.emitter.js";
import { JobEmitter } from "./emitters/jobs.emitter.js";
import { ToolEmitter } from "./emitters/tool.emitter.js";
import { WorkerEmitter } from "./emitters/worker.emitter.js";
import { SystemEmitter } from "./emitters/system.emitter.js";

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
  constructor(private readonly bus: EventBusPort) {}

  newSystemEmitter(
    scope: CloudScope & SystemScope & OtelContext
  ): SystemEmitter {
    return new SystemEmitter(this.bus, scope);
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
    const combinedScope = { ...scope, ...this.startNewTrace() };
    return new StepEmitter(this.bus, combinedScope);
  }
  newStepEmitterNewTrace(scope: CloudScope & StepScope): StepEmitter {
    const combinedScope = { ...scope, ...this.startNewTrace() };
    return new StepEmitter(this.bus, combinedScope);
  }
  newStepEmitterNewSpan(
    scope: CloudScope & StepScope,
    traceId: string
  ): StepEmitter {
    const combinedScope = { ...scope, ...this.makeNewSpan(traceId), traceId };
    return new StepEmitter(this.bus, combinedScope);
  }

  newJobEmitter(scope: CloudScope & JobScope & OtelContext): JobEmitter {
    return new JobEmitter(this.bus, scope);
  }
  newJobEmitterNewSpan(
    scope: CloudScope & JobScope,
    traceId: string
  ): JobEmitter {
    const combinedScope = { ...scope, ...this.makeNewSpan(traceId), traceId };
    return new JobEmitter(this.bus, combinedScope);
  }
  newJobEmitterFromEvent(event: AllJobEvents, source: string) {
    const { spanId, traceParent } = this.makeNewSpan(event.traceid);
    return this.newJobEmitter({
      source,
      flowid: event.flowid,
      runid: event.runid,
      stepid: event.stepid,
      jobid: event.jobid,
      traceId: event.traceid,
      spanId,
      traceParent,
    });
  }
  newToolEmitter(scope: CloudScope & ToolScope & OtelContext): ToolEmitter {
    return new ToolEmitter(this.bus, scope);
  }

  makeNewSpan(traceId: string): { spanId: string; traceParent: string } {
    const spanId = this.generateSpanId();
    const traceParent = this.makeTraceParent(traceId, spanId);
    return { spanId, traceParent };
  }

  startNewTrace(sampled = true): {
    traceId: string;
    spanId: string;
    traceParent: string;
  } {
    const traceId = this.generateTraceId();
    const spanId = this.generateSpanId();
    const traceParent = this.makeTraceParent(traceId, spanId, sampled);

    return { traceId, spanId, traceParent };
  }

  makeTraceParent(traceId: string, spanId: string, sampled = true): string {
    const version = "00";
    const flags = sampled ? "01" : "00";
    const traceParent = `${version}-${traceId}-${spanId}-${flags}`;
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
