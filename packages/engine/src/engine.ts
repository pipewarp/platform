import fs from "fs";
import type { RunContext, Flow } from "@pipewarp/specs";
import type {
  EventBusPort,
  StartFlowInput,
  StreamRegistryPort,
} from "@pipewarp/ports";
import type { AnyEvent } from "@pipewarp/types";
import { EmitterFactory } from "@pipewarp/events";
import { FlowStore } from "@pipewarp/adapters/flow-store";
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
      console.log("[engine bus] flows.lifecycle event:", e);
      if (e.type === "flow.queued") {
        const event = e as AnyEvent<"flow.queued">;

        const spanId = this.emitterFactory.generateSpanId();
        const traceParent = this.emitterFactory.makeTraceParent(
          event.traceid,
          spanId
        );
        const flowEmitter = this.emitterFactory.newFlowEmitter({
          source: "pipewarp://engine/flow/queued",
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

        await this.startFlow(
          {
            correlationId: "none",
            flowName: event.data.flowName,
            outfile: event.data.outfile,
            test: event.data.test,
            inputs: {},
          },
          event.traceid
        );
      }
    });

    await this.bus.subscribe("jobs.lifecycle", async (e: AnyEvent) => {
      console.log("[engine bus] steps.lifecycle event:", e);
      if (e.type === "job.completed") {
        const jobCompletedEvent = e as AnyEvent<"job.completed">;
        await this.handleWorkerDone(jobCompletedEvent);
      }
    });

    await this.bus.subscribe("workers.lifecycle", async (e: AnyEvent) => {
      console.log("[engine] workers.lifecycle event:", e);
      if (e.type === "worker.registration.requested") {
        const event = e as AnyEvent<"worker.registration.requested">;
        this.resourceRegistry.registerWorker(event.data);

        // this.bus.publish("workers.lifecycle", {
        //   id: String(crypto.randomUUID()),
        //   source: "resource-registry://default",
        //   specversion: "1.0",
        //   time: new Date().toISOString(),
        //   type: "worker.registered",
        //   data: {
        //     workerId: event.data.id,
        //     status: "accepted",
        //     registeredAt: new Date().toISOString(),
        //   },
        //   action: "registered",
        //   domain: "worker",
        //   spanid: "",
        //   traceid: "",
        //   traceparent: "",
        // } satisfies AnyEvent<"worker.registered">);

        const spanId = this.emitterFactory.generateSpanId();
        const traceParent = this.emitterFactory.makeTraceParent(
          e.traceid,
          spanId
        );

        const workerEmitter = this.emitterFactory.newWorkerEmitter({
          source: "pipewarp://engine/resource-registry",
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
      source: "pipewarp://engine/start",
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
      source: "pipewarp://engine/stop/",
      engineid: "default-engine",
      traceId,
      spanId,
      traceParent,
    });

    emitter.emit("engine.stopped", {
      engine: {
        id: "default-engine",
        version: "0.1.0-alpha.4",
      },
      status: "stopped",
      reason: "SIGINT called",
    });

    await this.bus.close();
  }

  async startFlow(input: StartFlowInput, traceId: string): Promise<void> {
    // get flow definition
    console.log("[engine] startFlow");
    const { flowName, inputs, correlationId } = input;

    const flow = this.flowDb.get(flowName);
    if (!flow) {
      console.error(`[engine] no flow in database for name: ${flowName}`);
      return;
    }
    // make context
    let context = this.#buildRunContext(
      flow.name,
      correlationId,
      input.test,
      input.outfile,
      traceId
    );
    context = this.#initStepContext(context, flow.start);
    console.log("[engine] made RunContext:\n", context);

    const spanId = this.emitterFactory.generateSpanId();
    const traceParent = this.emitterFactory.makeTraceParent(traceId, spanId);
    const emitter = this.emitterFactory.newRunEmitter({
      source: "pipewarp://engine/start-flow",
      flowid: flow.name,
      runid: context.runId,
      traceId,
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

    // const stepEmitter = this.emitterFactory.newStepEmitter();
    const spanId = this.emitterFactory.generateSpanId();
    const traceParent = this.emitterFactory.makeTraceParent(
      context.traceId,
      spanId
    );
    const jobEmitter = this.emitterFactory.newJobEmitter({
      source: "pipewarp://engine/queue-step",
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
  #buildRunContext(
    flowName: string,
    correlationId: string,
    isTest: boolean | undefined = false,
    outFile: string | undefined = "./output.json",
    traceId: string
  ): RunContext {
    const context: RunContext = {
      runId: isTest ? "test-run-id" : String(crypto.randomUUID()),
      traceId,
      // step state stuff
      runningSteps: new Set(),
      queuedSteps: new Set(),
      doneSteps: new Set(),
      stepStatusCounts: {},
      outstandingSteps: 0,

      // test stuff
      test: isTest,
      outFile,

      flowName,
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

    context.queuedSteps.delete(e.stepid);
    context.runningSteps.delete(e.stepid);
    context.doneSteps.add(e.stepid);
    context.outstandingSteps--;

    this.writeRunContext(e.runid);

    // now get next step and start it.
    const flow = this.flowDb.get(context.flowName);

    if (!flow) {
      console.log(`[engine] executeStep(): no flow for ${context.flowName}`);
      return;
    }
    const nextStep = this.#getNextStepName(flow, context, e.stepid);

    if (nextStep) {
      this.queueStreamingSteps(flow, context, nextStep);
    } else if (context.outstandingSteps === 0) {
      console.log("[engine] no next step; no outstanding steps; run ended;");

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
        source: "pipewarp://worker/run/ended",
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
        source: "pipewarp://worker/run/ended",
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
    console.log("[engine] writing context to disk");
    const context = this.#runs.get(runId);
    const file =
      context?.outFile !== undefined ? context.outFile : "./output.json";

    fs.writeFileSync(file, JSON.stringify(context, null, 2));
    return;
  }
}
