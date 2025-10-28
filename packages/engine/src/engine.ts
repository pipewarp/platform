import fs from "fs";
import type { RunContext, Flow } from "@pipewarp/specs";
import type {
  EventBusPort,
  StartFlowInput,
  StreamRegistryPort,
} from "@pipewarp/ports";
import type { AnyEvent, StepEventType } from "@pipewarp/types";
import { StepEmitter } from "@pipewarp/events";
import { FlowStore } from "@pipewarp/adapters/flow-store";
import type { StepHandlerRegistry } from "./step-handler.registry.js";

/**
 * Engine class runs flows as the orchestration center.
 * It handles multiple runs in one instance.
 * Each run gets its own context.
 * Uses step handlers to actually emit events.
 */
export class Engine {
  #runs = new Map<string, RunContext>();

  constructor(
    private readonly flowDb: FlowStore,
    private readonly bus: EventBusPort,
    private readonly streamRegistry: StreamRegistryPort,
    private readonly stepHandlerRegistry: StepHandlerRegistry
  ) {
    console.log("[engine] constructor");
    this.bus = bus;
    this.bus.subscribe("flows.lifecycle", async (e: AnyEvent) => {
      console.log("[engine bus] flows.lifecycle event:", e);
      if (e.type === "flow.queued") {
        e = e as AnyEvent<"flow.queued">;
        await this.startFlow({
          correlationId: e.correlationId,
          flowName: e.data.flowName,
          outfile: e.data.outfile,
          test: e.data.test,
        });
      }
    });

    this.bus.subscribe("steps.lifecycle", async (e: AnyEvent) => {
      console.log("[engine bus] steps.lifecycle event:", e);
      if (e.type === "step.action.completed") {
        e = e as AnyEvent<"step.action.completed">;
        await this.handleWorkerDone(e);
      }
    });
  }

  async startFlow(input: StartFlowInput): Promise<void> {
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
      input.outfile
    );
    context = this.#initStepContext(context, flow.start);
    console.log("[engine] made RunContext:\n", context);

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
    const handler = this.stepHandlerRegistry[stepType];

    // in future this should be bundled as DI not instantiated in class
    // class should change to an emitter factory instead of specific emitters
    const emitter = new StepEmitter("step.action.queued", this.bus, {
      correlationId: context.correlationId,
      flowId: context.flowName,
      runId: context.runId,
      source: "/engine/stepHandler",
      stepId: stepName,
      stepType: "action",
    });

    await handler.queue(flow, context, stepName, emitter);

    context.queuedSteps.add(stepName);
    context.outstandingSteps++;
    this.#runs.set(context.runId, context);
  }
  #buildRunContext(
    flowName: string,
    correlationId: string,
    isTest: boolean | undefined = false,
    outFile: string | undefined = "./output.json"
  ): RunContext {
    const context: RunContext = {
      runId: isTest ? "test-run-id" : String(crypto.randomUUID()),
      correlationId,
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
    const e = event as AnyEvent<"step.action.completed">;
    // update context based on completed event
    if (!this.#runs.has(e.runId)) {
      console.error(`[engine] invalid run id: ${e.runId}`);
      return;
    }
    const context = this.#runs.get(e.runId)!;

    const result = e.data.result
      ? (e.data.result as Array<Record<string, unknown>>)
      : [{ data: null }];
    if (e.data.result) {
      context.steps[e.stepId].result = { result };
    }
    context.steps[e.stepId].status = e.data.ok ? "success" : "failure";

    context.queuedSteps.delete(e.stepId);
    context.runningSteps.delete(e.stepId);
    context.doneSteps.add(e.stepId);
    context.outstandingSteps--;

    this.#runs.set(e.runId, context);
    this.writeRunContext(e.runId);

    // now get next step and start it.
    const flow = this.flowDb.get(context.flowName);

    if (!flow) {
      console.log(`[engine] executeStep(): no flow for ${context.flowName}`);
      return;
    }
    const nextStep = this.#getNextStepName(flow, context, e.stepId);

    if (nextStep) {
      this.queueStreamingSteps(flow, context, nextStep);
    } else if (context.outstandingSteps === 0) {
      console.log("[engine] no next step; no outstanding steps; run ended;");
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
