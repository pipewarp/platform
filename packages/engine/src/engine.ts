import fs from "fs";
import type { RunContext, Flow } from "@lcase/specs";
import type {
  EventBusPort,
  StartFlowInput,
  StreamRegistryPort,
} from "@lcase/ports";
import type { AnyEvent, FlowQueuedData } from "@lcase/types";
import { EmitterFactory } from "@lcase/events";
import { FlowStore } from "@lcase/adapters/flow-store";
import type { StepHandlerRegistry } from "./step-handler.registry.js";
import { ResourceRegistry } from "./resource-registry.js";

/**
 * Engine class runs flows as the orchestration center.
 * It handles multiple runs in one instance.
 * Each run gets its own context.
 * Passes scoped emitters to handlers for emitting events.
 */
export class Engine {
  #runs = new Map<string, RunContext>();

  constructor(
    private readonly flowDb: FlowStore,
    private readonly bus: EventBusPort,
    private readonly streamRegistry: StreamRegistryPort,
    private readonly stepHandlerRegistry: StepHandlerRegistry,
    private readonly resourceRegistry: ResourceRegistry,
    private readonly emitterFactory: EmitterFactory
  ) {}

  async subscribeToTopics(): Promise<void> {
    await this.bus.subscribe("flows.lifecycle", async (e: AnyEvent) => {
      if (e.type === "flow.queued") {
        const event = e as AnyEvent<"flow.queued">;

        const spanId = this.emitterFactory.generateSpanId();
        const traceParent = this.emitterFactory.makeTraceParent(
          event.traceid,
          spanId
        );
        const flowEmitter = this.emitterFactory.newFlowEmitter({
          source: "lowercase://engine/flow/queued",
          flowid: event.flowid,
          traceId: event.traceid,
          spanId,
          traceParent,
        });

        flowEmitter.emit("flow.started", {
          flow: {
            id: event.flowid,
            name: event.data.flow.name,
            version: event.data.flow.version,
          },
        });

        await this.startFlow(event);
      }
    });

    await this.bus.subscribe("jobs.lifecycle", async (e: AnyEvent) => {
      if (e.type === "job.completed") {
        const jobCompletedEvent = e as AnyEvent<"job.completed">;
        await this.handleWorkerDone(jobCompletedEvent);
      }
    });

    await this.bus.subscribe("workers.lifecycle", async (e: AnyEvent) => {
      if (e.type === "worker.registration.requested") {
        const event = e as AnyEvent<"worker.registration.requested">;
        this.resourceRegistry.registerWorker(event.data);

        const spanId = this.emitterFactory.generateSpanId();
        const traceParent = this.emitterFactory.makeTraceParent(
          e.traceid,
          spanId
        );

        const workerEmitter = this.emitterFactory.newWorkerEmitter({
          source: "lowercase://engine/resource-registry",
          workerid: event.data.worker.id,
          traceId: event.traceid,
          spanId,
          traceParent,
        });

        await workerEmitter.emit("worker.registered", {
          worker: {
            id: event.data.worker.id,
          },
          workerId: event.data.worker.id,
          status: "accepted",
          registeredAt: new Date().toISOString(),
        });
      }
    });
  }

  async start() {
    const traceId = this.emitterFactory.generateTraceId();
    const spanId = this.emitterFactory.generateSpanId();
    const traceParent = this.emitterFactory.makeTraceParent(traceId, spanId);
    const emitter = this.emitterFactory.newEngineEmitter({
      source: "lowercase://engine/start",
      engineid: "default-engine",
      traceId,
      spanId,
      traceParent,
    });

    emitter.emit("engine.started", {
      engine: {
        id: "default-engine",
        version: "0.1.0-alpha.4",
      },
      status: "started",
    });
    await this.subscribeToTopics();
  }
  async stop() {
    const traceId = this.emitterFactory.generateTraceId();
    const spanId = this.emitterFactory.generateSpanId();
    const traceParent = this.emitterFactory.makeTraceParent(traceId, spanId);
    const emitter = this.emitterFactory.newEngineEmitter({
      source: "lowercase://engine/stop/",
      engineid: "default-engine",
      traceId,
      spanId,
      traceParent,
    });

    emitter.emit("engine.stopped", {
      engine: {
        id: "default-engine",
        version: "0.1.0-alpha.6",
      },
      status: "stopped",
      reason: "SIGINT called",
    });

    await this.bus.close();
  }

  async startFlow(event: AnyEvent<"flow.queued">): Promise<void> {
    /**
     * casting as flow now because the specs package cannot be
     * imported into @lcase/types.
     * this will change when flow definitions are moved to the
     * types package, and specs is a home for schemas
     */
    const flow = event.data.definition as Flow;
    let context = this.#buildRunContext(event);
    context = this.#initStepContext(context, flow.start);

    const systemSpanId = this.emitterFactory.generateSpanId();
    const systemTraceParent = this.emitterFactory.makeTraceParent(
      event.traceid,
      systemSpanId
    );
    const logEmitter = this.emitterFactory.newSystemEmitter({
      source: "lowercase://engine/start-flow",
      traceId: event.traceid,
      spanId: systemSpanId,
      traceParent: systemTraceParent,
    });
    await logEmitter.emit("system.logged", {
      log: "[engine] made RunContext",
    });

    const spanId = this.emitterFactory.generateSpanId();
    const traceParent = this.emitterFactory.makeTraceParent(
      event.traceid,
      spanId
    );
    const emitter = this.emitterFactory.newRunEmitter({
      source: "lowercase://engine/start-flow",
      flowid: flow.name,
      runid: context.runId,
      traceId: event.traceid,
      spanId,
      traceParent,
    });

    emitter.emit("run.started", {
      run: {
        id: context.runId,
        status: "started",
      },
      engine: {
        id: "default-engine",
      },
      status: "started",
    });
    await this.queueStreamingSteps(flow, context, flow.start);
    return;
  }

  /**
   * Queues a step, and steps it pipes data to.
   * If further steps also pipe, their to targets are queued too.
   * @param flow Flow definition
   * @param context RunContext
   * @param stepName name of first step
   */
  async queueStreamingSteps(
    flow: Flow,
    context: RunContext,
    stepName: string
  ): Promise<void> {
    while (true) {
      context = this.#initStepContext(context, stepName);
      await this.queueStep(flow, context, stepName);
      const pipeToStep = flow.steps[stepName].pipe?.to?.step;
      if (context.steps[stepName].pipe.to && pipeToStep) {
        stepName = pipeToStep;
      } else {
        break;
      }
    }
  }
  // queues a single step vs multiple
  async queueStep(
    flow: Flow,
    context: RunContext,
    stepName: string
  ): Promise<void> {
    const stepType = flow.steps[stepName].type;
    const stepSpanId = this.emitterFactory.generateSpanId();
    const stepTraceParent = this.emitterFactory.makeTraceParent(
      context.traceId,
      stepSpanId
    );
    const stepEmitter = this.emitterFactory.newStepEmitter({
      source: "lowercase://engine/queue-step",
      flowid: context.flowName,
      runid: context.runId,
      stepid: stepName,
      steptype: stepType,
      traceId: context.traceId,
      spanId: stepSpanId,
      traceParent: stepTraceParent,
    });
    stepEmitter.emit("step.started", {
      step: {
        id: stepName,
        name: stepName,
        type: stepType,
      },
      status: "started",
    });

    // const stepEmitter = this.emitterFactory.newStepEmitter();
    const spanId = this.emitterFactory.generateSpanId();
    const traceParent = this.emitterFactory.makeTraceParent(
      context.traceId,
      spanId
    );
    const jobEmitter = this.emitterFactory.newJobEmitter({
      source: "lowercase://engine/queue-step",
      flowid: context.flowName,
      runid: context.runId,
      stepid: stepName,
      jobid: String(crypto.randomUUID()),
      traceId: context.traceId,
      spanId,
      traceParent,
    });

    if (stepType === "mcp") {
      const capName = flow.steps[stepName].type;
      const caps = this.resourceRegistry.getCapability(capName);
      if (caps === undefined) {
        throw new Error(
          `[engine] no capability in local resource registry for ${capName}`
        );
      }

      const handler = this.stepHandlerRegistry[stepType];
      await handler.queue(flow, context, stepName, jobEmitter);
    }

    context.queuedSteps.add(stepName);
    context.outstandingSteps++;
    this.#runs.set(context.runId, context);
  }
  #buildRunContext(event: AnyEvent<"flow.queued">): RunContext {
    const context: RunContext = {
      definition: event.data.definition as Flow,
      flowId: event.data.flow.id,
      runId: event.data.test ? "test-run-id" : String(crypto.randomUUID()),
      traceId: event.traceid,
      // step state stuff
      runningSteps: new Set(),
      queuedSteps: new Set(),
      doneSteps: new Set(),
      stepStatusCounts: {},
      outstandingSteps: 0,

      // test stuff
      test: event.data.test,
      outFile: event.data.outfile,

      flowName: event.data.flowName,
      status: "running",
      globals: {},
      exports: {},
      inputs: {},
      steps: {},
    };
    return context;
  }
  #initStepContext(context: RunContext, stepName: string): RunContext {
    context.steps[stepName] = {
      attempt: 0,
      exports: {},
      pipe: {},
      result: {},
      status: "idle",
    };
    return context;
  }

  #getNextStepName(
    flow: Flow,
    context: RunContext,
    currentStep: string
  ): string | undefined {
    const status = context.steps[currentStep].status as "success" | "failure";
    const nextStepName = flow.steps[currentStep].on?.[status];
    return nextStepName;
  }

  async handleWorkerDone(event: AnyEvent): Promise<void> {
    const e = event as AnyEvent<"job.completed">;
    // update context based on completed event
    if (!this.#runs.has(e.runid)) {
      console.error(`[engine] invalid run id: ${e.runid}`);
      return;
    }
    const context = this.#runs.get(e.runid)!;

    const result = e.data.result
      ? (e.data.result as Array<Record<string, unknown>>)
      : [{ data: null }];
    if (e.data.result) {
      context.steps[e.stepid].result = { result };
    }
    context.steps[e.stepid].status = "success";

    const stepSpanId = this.emitterFactory.generateSpanId();
    const stepTraceParent = this.emitterFactory.makeTraceParent(
      context.traceId,
      stepSpanId
    );
    const flow = context.definition;

    if (!flow) return;
    flow.steps[e.stepid].type;

    const stepEmitter = this.emitterFactory.newStepEmitter({
      source: "lowercase://engine/handle-worker-done",
      flowid: context.flowName,
      runid: context.runId,
      stepid: e.stepid,
      steptype: flow.steps[e.stepid].type,
      traceId: context.traceId,
      spanId: stepSpanId,
      traceParent: stepTraceParent,
    });
    stepEmitter.emit("step.completed", {
      step: {
        id: e.stepid,
        name: e.stepid,
        type: flow.steps[e.stepid].type,
      },
      status: "completed",
    });

    context.queuedSteps.delete(e.stepid);
    context.runningSteps.delete(e.stepid);
    context.doneSteps.add(e.stepid);
    context.outstandingSteps--;

    this.writeRunContext(e.runid);

    if (!flow) {
      console.log(`[engine] executeStep(): no flow for ${context.flowName}`);
      return;
    }
    const nextStep = this.#getNextStepName(flow, context, e.stepid);

    if (nextStep) {
      this.queueStreamingSteps(flow, context, nextStep);
    } else if (context.outstandingSteps === 0) {
      const logEmitter = this.emitterFactory.newSystemEmitter({
        source: "lowercase://engine/handle-work-done",
        traceId: "",
        spanId: "",
        traceParent: "",
      });
      await logEmitter.emit("system.logged", {
        log: "[engine] no next step; no outstanding steps; run ended;",
      });

      const runSpanId = this.emitterFactory.generateSpanId();
      const flowSpanId = this.emitterFactory.generateSpanId();
      const runTraceParent = this.emitterFactory.makeTraceParent(
        runSpanId,
        e.traceid
      );
      const flowTraceParent = this.emitterFactory.makeTraceParent(
        flowSpanId,
        e.traceid
      );

      const runEmitter = this.emitterFactory.newRunEmitter({
        source: "lowercase://worker/run/ended",
        flowid: e.flowid,
        runid: e.runid,
        traceId: e.traceid,
        spanId: runSpanId,
        traceParent: runTraceParent,
      });

      runEmitter.emit("run.completed", {
        run: {
          id: e.runid,
          status: "completed",
        },
        engine: {
          id: "default-engine",
        },
        status: "completed",
        message: "run is over",
      });

      const flowEmitter = this.emitterFactory.newFlowEmitter({
        source: "lowercase://worker/run/ended",
        flowid: e.flowid,
        traceId: e.traceid,
        spanId: runSpanId,
        traceParent: runTraceParent,
      });

      const flow = this.flowDb.get(e.flowid);
      if (!flow) return;
      await flowEmitter.emit("flow.completed", {
        flow: {
          id: e.flowid,
          name: flow.name,
          version: flow.version,
        },
      });

      return;
    }
  }

  writeRunContext(runId: string): void {
    const context = this.#runs.get(runId);
    const file =
      context?.outFile !== undefined ? context.outFile : "./output.temp.json";

    fs.writeFileSync(file, JSON.stringify(context, null, 2));

    const logEmitter = this.emitterFactory.newSystemEmitter({
      source: "lowercase://engine/write-run-context",
      traceId: "",
      spanId: "",
      traceParent: "",
    });
    logEmitter.emit("system.logged", {
      log: `[engine] context written to disk at ${file}`,
    });
    return;
  }
}
