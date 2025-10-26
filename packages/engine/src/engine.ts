import fs from "fs";
import { randomUUID } from "crypto";
import type { RunContext, Flow } from "@pipewarp/specs";
import type {
  EventBusPort,
  StartFlowInput,
  StepCompletedEvent,
  StreamRegistryPort,
} from "@pipewarp/ports";
import type { EventEnvelope } from "@pipewarp/types";
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
    this.bus.subscribe("flows.lifecycle", async (e: EventEnvelope) => {
      console.log("[engine bus] flows.lifecycle event:", e);
      if (e.kind === "flow.queued") {
        await this.startFlow({
          correlationId: e.correlationId,
          flowName: e.data.flowName,
          outfile: e.data.outfile,
          test: e.data.test,
        });
      }
    });

    this.bus.subscribe("steps.lifecycle", async (e: EventEnvelope) => {
      console.log("[engine bus] steps.lifecycle event:", e);
      if (e.kind === "step.completed") {
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
    await handler.queue(flow, context, stepName);

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
      runId: isTest ? "test-run-id" : randomUUID(),
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

  async handleWorkerDone(event: StepCompletedEvent): Promise<void> {
    // update context based on completed event
    if (!this.#runs.has(event.runId)) {
      console.error(`[engine] invalid run id: ${event.runId}`);
      return;
    }
    const context = this.#runs.get(event.runId)!;

    const result = event.data.result
      ? (event.data.result as Array<Record<string, unknown>>)
      : [{ data: null }];
    if (event.data.result) {
      context.steps[event.data.stepName].result = { result };
    }
    context.steps[event.data.stepName].status = event.data.ok
      ? "success"
      : "failure";

    context.queuedSteps.delete(event.data.stepName);
    context.runningSteps.delete(event.data.stepName);
    context.doneSteps.add(event.data.stepName);
    context.outstandingSteps--;

    this.#runs.set(event.runId, context);
    this.writeRunContext(event.runId);

    // now get next step and start it.
    const flow = this.flowDb.get(context.flowName);

    if (!flow) {
      console.log(`[engine] executeStep(): no flow for ${context.flowName}`);
      return;
    }
    const nextStep = this.#getNextStepName(flow, context, event.data.stepName);

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
