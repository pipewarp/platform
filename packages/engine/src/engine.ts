import { randomUUID } from "crypto";
import type {
  RunContext,
  ToolStep,
  StepArgs,
  StepEvent,
  EventEnvelope,
} from "@pipewarp/core/types";
import type {
  EnginePort,
  ExecuteStepCommand,
  StartFlowInput,
  StartFlowResult,
} from "@pipewarp/core/ports";
import { FlowStore } from "@pipewarp/adapters/flow-store";
import { type McpId, McpManager } from "@pipewarp/adapters/step-executor";
import type { McpRunnerPort } from "@pipewarp/core/ports";
import { resolveStepArgs } from "./resolve.js";
import fs from "fs";

export type StepRunner = {
  run: () => Promise<void>;
};

export class Engine implements EnginePort {
  #runs = new Map<string, RunContext>();
  #queues = new Map<McpId, EventEnvelope[]>();
  #runners = new Map<string, McpRunnerPort>();

  constructor(private flowDb: FlowStore, private mcps: McpManager) {
    console.log("[engine] constructor");
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

    await this.startStepRunners();
    console.log("[engine] running step runners");

    // get first step data
    if (flow.steps[flow.start].type === "tool") {
      const startStep: ToolStep = flow.steps[flow.start] as ToolStep;
      startStep.mcp;
      const resourceKey = startStep.mcp;

      const event: EventEnvelope = {
        id: randomUUID().slice(0, 8),
        type: "start.step",
        time: new Date().toISOString(),
        data: {
          stepName: flow.start,
          runId: context.runId,
          flowName: flow.name,
          mcpId: startStep.mcp,
        },
      };

      this.enqueue(startStep.mcp, event);
    }
  }

  async startStepRunners(): Promise<void> {
    for await (const [mcpId] of this.mcps) {
      const stepRunner = await this.stepRunner(mcpId);
      stepRunner.start();
      this.#runners.set(mcpId, await this.stepRunner(mcpId));
    }
  }

  enqueue(mcpId: string, event: EventEnvelope) {
    if (this.#queues.has(mcpId)) {
      const queue = this.#queues.get(mcpId);
      queue!.push(event);
    } else {
      this.#queues.set(mcpId, [event]);
    }
    console.log(
      `[enqueue] full queue for mcpid: ${mcpId};`,
      JSON.stringify(this.#queues.get(mcpId), null, 2)
    );
  }

  dequeue(mcpId: McpId): EventEnvelope | false {
    if (!this.#queues.has(mcpId)) return false;
    const event = this.#queues.get(mcpId)!.shift() ?? false;
    if (event) {
      console.log(`[dequeue] event from mcpId queue: ${mcpId}`);
    }
    return event;
  }

  async executeStep(
    cmd: ExecuteStepCommand
  ): Promise<ExecuteStepCommand | undefined> {
    // load run/step state; mark as running
    if (!this.#runs.has(cmd.runId)) {
      console.error(
        `[engine] executeStep(): no context for runId: ${cmd.runId}`
      );
      return;
    }

    const context = this.#runs.get(cmd.runId);
    if (context === undefined) {
      console.error(`[engine] context is undefined for runId ${cmd.runId}`);
      return;
    }

    const flow = this.flowDb.get(context.flowName);
    if (!flow) {
      console.log(`[engine] executeStep(): no flow for ${context.flowName}`);
      return;
    }
    const step = flow.steps[cmd.stepName]; // get client handler // resolve args

    // invoke tool
    if (step.type === "tool") {
      const mcpDb = this.mcps.get(step.mcp);
      if (!mcpDb) {
        console.log(`[engine] executeStep(): no mcp for ${step.mcp}`);
        return;
      }
      const mcpClient = mcpDb.client;

      let args: StepArgs = {};
      if (step.args) {
        resolveStepArgs(context, step.args);
        args = step.args;
      }

      const response = await mcpClient.callTool({
        name: step.tool,
        arguments: args,
      });
      console.log(`[engine] executeStep response:`, response);

      // record result
      const content = response.content as Array<Record<string, unknown>>;
      context.steps[cmd.stepName] = {
        result: content[0],
        status: response.isError ? "error" : "success",
        attempt: cmd.attempt,
        exports: {},
      };

      context.status = "running";

      this.#runs.set(cmd.runId, context);

      console.log(
        `[engine] executeStep context`,
        JSON.stringify(context, null, 2)
      );
    }

    // get next steps

    const currentStep = flow?.steps[cmd.stepName];
    const nextStepName = currentStep?.on?.success;
    if (flow && nextStepName && nextStepName.length > 0) {
      const nextStep = flow.steps[nextStepName] as ToolStep;

      // queue next step
      if (nextStep) {
        const data: StepEvent = {
          mcpId: nextStep.mcp,
          flowName: flow.name,
          runId: cmd.runId,
          stepName: nextStepName,
          args: nextStep.args,
        };
        const event: EventEnvelope = {
          id: "executeStepId",
          time: new Date().toISOString(),
          type: "start.step",
          data,
        };
        this.enqueue(nextStep.mcp, event);
      }
    } else {
      console.log("no next step");
      console.log("final context:", JSON.stringify(context, null, 2));
      this.writeRunContext(cmd.runId, "path");
    }
    return;
  }

  async stepRunner(mcpId: McpId): Promise<McpRunnerPort> {
    let isRunning = false;

    const engine = this;
    const ms = 1000;

    const sleep = async (): Promise<void> =>
      new Promise((resolve) => setTimeout(resolve, ms));

    const runner: McpRunnerPort = {
      async start() {
        isRunning = true;

        console.log(`[runner] looping for ${mcpId} every ${ms}ms`);
        while (isRunning) {
          const result = engine.dequeue(mcpId);

          if (!result) {
            await sleep();
            continue;
          } else {
            console.log(`[runner] handling dequeued event`);

            if (result.type === "start.step") {
              const event = result.data as StepEvent;

              const cmd: ExecuteStepCommand = {
                attempt: 1,
                stepName: event.stepName,
                runId: event.runId,
                mcpId: event.mcpId,
                taskId: "",
              };

              console.log(`[runner] executing command`);
              await engine.executeStep(cmd);
            }
          }
        }
      },
      async stop() {
        isRunning = false;
      },
    };
    return runner;
  }

  writeRunContext(runId: string, outPath: string): void {
    const context = this.#runs.get(runId);
    fs.writeFileSync("./output.json", JSON.stringify(context));
    return;
  }
}
