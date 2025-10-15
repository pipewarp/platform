import { randomUUID } from "crypto";
import type {
  RunContext,
  Status,
  ActionStep,
  Flow,
  Step,
} from "@pipewarp/specs";
import type {
  EventBusPort,
  EventEnvelope,
  StartFlowInput,
  StartFlowResult,
  StepCompletedEvent,
} from "@pipewarp/ports";
import { FlowStore } from "@pipewarp/adapters/flow-store";
import { resolveStepArgs } from "./resolve.js";

import fs from "fs";

export class Engine {
  #runs = new Map<string, RunContext>();

  constructor(
    private readonly flowDb: FlowStore,
    private readonly bus: EventBusPort
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

  async startFlow(input: StartFlowInput): Promise<StartFlowResult | undefined> {
    // get flow definition
    console.log("[engine] startFlow");
    const { flowName, inputs, correlationId } = input;

    const flow = this.flowDb.get(flowName);
    if (!flow) {
      console.error(`[engine] no flow in database for name: ${flowName}`);
      return;
    }

    // make context

    // results, response, output, out,
    const context: RunContext = {
      runId: input.test ? "test-run-id" : randomUUID(),
      test: input.test ? true : false,
      outFile: input.outfile ?? "./output.json",

      flowName: flow.name,
      status: "running",
      globals: {},
      exports: {},
      inputs: {},
      steps: {},
    };
    console.log("[engine] made RunContext:\n", context);

    this.#runs.set(context.runId, context);

    // start step runners

    console.log("[engine] starting step runners");

    // get first step data
    if (flow.steps[flow.start].type === "action") {
      const startStep: ActionStep = flow.steps[flow.start] as ActionStep;

      let args;
      if (startStep.args !== undefined) {
        args = resolveStepArgs(context, startStep.args);
      }
      console.log(args);
      const event: EventEnvelope = {
        id: randomUUID().slice(0, 8),
        correlationId: randomUUID().slice(0, 8),
        kind: "step.queued",
        time: new Date().toISOString(),
        runId: context.runId,
        data: {
          stepName: flow.start,
          stepType: startStep.type,
          tool: startStep.tool,
          op: startStep.op,
          args: args,
        },
      };

      this.bus.publish("steps.lifecycle", event);
      // this.enqueue(startStep.mcp, event);
    }
  }

  createNextStepEvent(
    flow: Flow,
    context: RunContext,
    currentStep: Step,
    status: "success" | "failure"
  ): EventEnvelope | undefined {
    const nextStepName = currentStep.on?.[status];
    if (!nextStepName) return;

    if (flow.steps[nextStepName].type === "action") {
      const nextStep: ActionStep = flow.steps[nextStepName] as ActionStep;

      let args;
      if (nextStep.args !== undefined) {
        args = resolveStepArgs(context, nextStep.args);
      }
      console.log(args);
      const event: EventEnvelope = {
        id: randomUUID().slice(0, 8),
        correlationId: randomUUID().slice(0, 8),
        kind: "step.queued",
        time: new Date().toISOString(),
        runId: context.runId,
        data: {
          stepName: nextStepName,
          stepType: nextStep.type,
          tool: nextStep.tool,
          op: nextStep.op,
          args: args,
        },
      };
      return event;
    }
  }

  async handleWorkerDone(e: StepCompletedEvent): Promise<void> {
    // handle step return value
    const context = this.#runs.get(e.runId);

    if (context === undefined) {
      console.error(`[engine] context is undefined for runId ${e.runId}`);
      return;
    }

    const result = e.data.result
      ? (e.data.result as Array<Record<string, unknown>>)
      : [];

    const stepStatus = e.data.ok ? "success" : "failure";
    if (context?.steps[e.data.stepName] === undefined) {
      context!.steps[e.data.stepName] = {
        attempt: 1,
        exports: {},
        result: result[0],
        status: stepStatus,
      };
    }

    if (e.data.ok === false) {
      context.status = "failure";
      const m = `[engine] worker tool returned error response: ${e.data.result}`;
      context.steps[e.data.stepName].reason = m + " " + e.data.error;
      this.saveStepStatus(context, e.data.stepName, "failure", m);
    } else {
      this.saveStepStatus(context, e.data.stepName, "success");
    }

    this.#runs.set(e.runId, context);
    this.writeRunContext(e.runId);

    // now get next step and start it.
    const flow = this.flowDb.get(context.flowName);

    if (!flow) {
      console.log(`[engine] executeStep(): no flow for ${context.flowName}`);
      return;
    }
    const step = flow.steps[e.data.stepName];
    const event = this.createNextStepEvent(flow, context, step, stepStatus);

    if (event === undefined) {
      console.log("[engine] no next step; run ended;");
      return;
    }

    console.log("[engine] next event: ", event);
    await this.bus.publish("steps.lifecycle", event);
  }

  saveStepStatus(
    context: RunContext,
    stepName: string,
    status: Status,
    message?: string
  ): void {
    if (context.steps[stepName] === undefined) {
      context.steps[stepName] = {
        attempt: 1,
        exports: {},
        result: {},
        status,
      };
    } else {
      context.steps[stepName].status = status;
    }

    if (message !== undefined) {
      context.steps[stepName]["reason"] = message;
    }
    context.status = status;
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
