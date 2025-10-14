import { randomUUID } from "crypto";
import type {
  RunContext,
  ToolStep,
  StepArgs,
  // StepEvent,
  Status,
  ActionStep,
} from "@pipewarp/specs";
import type {
  EnginePort,
  EventBusPort,
  EventEnvelope,
  ExecuteStepCommand,
  StartFlowInput,
  StartFlowResult,
  McpRunnerPort,
  StepQueuedEvent,
  ActionQueuedData,
  QueuePort,
} from "@pipewarp/ports";
import { FlowStore } from "@pipewarp/adapters/flow-store";
import { type McpId, McpManager } from "@pipewarp/adapters/step-executor";
import { resolveStepArgs } from "./resolve.js";

import fs from "fs";

export type StepRunner = {
  run: () => Promise<void>;
};

export class Engine {
  #runs = new Map<string, RunContext>();
  #queues = new Map<McpId, EventEnvelope[]>();
  #runners = new Map<string, McpRunnerPort>();

  constructor(
    private flowDb: FlowStore,
    private mcps: McpManager,
    private bus: EventBusPort,
    private readonly queues: QueuePort
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
    // this.bus.subscribe("steps.lifecycle", async (e: EventEnvelope) => {
    //   console.log("[engine bus] steps.lifecycle event:", e);
    //   if (e.kind === "step.queued" && e.data.stepType === "action") {
    //     this.queues.enqueue(e.data.tool, e);
    //     this.enqueue(e.data.tool, e);
    //   }
    // });
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

    await this.startStepRunners();
    console.log("[engine] running step runners");

    // get first step data
    if (flow.steps[flow.start].type === "action") {
      const startStep: ActionStep = flow.steps[flow.start] as ActionStep;

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
        },
      };

      this.bus.publish("steps.lifecycle", event);
      // this.enqueue(startStep.mcp, event);
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

    const step = flow.steps[cmd.stepName];

    if (step.type === "action") {
      const mcpDb = this.mcps.get(step.tool);
      if (!mcpDb) {
        const log = `[engine] executeStep(): no mcp for ${step.tool}`;
        console.log(log);

        this.saveStepStatus(
          context,
          cmd.stepName,
          "failure",
          `No mcp found for ${step.tool}`
        );
        this.writeRunContext(cmd.runId);
        return;
      }
      const mcpClient = mcpDb.client;

      let args: StepArgs = {};
      if (step.args) {
        resolveStepArgs(context, step.args);
        args = step.args;
      }

      try {
        const response = await mcpClient.callTool({
          name: step.op,
          arguments: args,
        });
        console.log(`[engine] executeStep response:`, response);

        // record result
        const content = response.content as Array<Record<string, unknown>>;
        context.steps[cmd.stepName] = {
          result: content[0],
          status: response.isError ? "failure" : "success",
          attempt: cmd.attempt,
          exports: {},
        };

        if (response.isError) {
          const reason = `callTool '${step.tool}' returned an error`;
          context.steps[cmd.stepName].reason = reason;
          context.status = "failure";
        } else if (
          !Array.isArray(response.content) ||
          response.content.length <= 0
        ) {
          this.saveStepStatus(
            context,
            cmd.stepName,
            "failure",
            "Mcp tool returned invalid data shape"
          );
        }

        this.#runs.set(cmd.runId, context);

        console.log(
          `[engine] executeStep context`,
          JSON.stringify(context, null, 2)
        );
      } catch (e) {
        const error = e as Error;

        console.error(error.message);

        this.saveStepStatus(context, cmd.stepName, "failure", error.message);
        this.writeRunContext(cmd.runId);
      }
    }

    const stepOutcome = context.steps[cmd.stepName].status;

    // get next steps

    const currentStep = flow?.steps[cmd.stepName];

    const nextStepName =
      stepOutcome === "success"
        ? currentStep?.on?.success
        : currentStep?.on?.failure;

    if (flow && nextStepName && nextStepName.length > 0) {
      const nextStep = flow.steps[nextStepName] as ActionStep;

      // publish step queued event
      if (nextStep) {
        const event: EventEnvelope = {
          id: "executeStepId",
          time: new Date().toISOString(),
          kind: "step.queued",
          runId: cmd.runId,
          correlationId: "an-id",
          data: {
            stepType: "action",
            stepName: nextStepName,
            tool: nextStep.tool,
            op: nextStep.op,
            args: nextStep.args,
          },
        };
        this.bus.publish("steps.lifecycle", event);
        // this.enqueue(nextStep.mcp, event);
      }
    } else {
      console.log("no next step");
      console.log("final context:", JSON.stringify(context, null, 2));
      this.writeRunContext(cmd.runId);
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
          const event = await engine.queues.reserve(mcpId, "w");
          // const event = engine.dequeue(mcpId);

          if (!event) {
            await sleep();
            continue;
          } else {
            console.log(`[runner] handling dequeued event`);

            if (event.kind === "step.queued") {
              if (event.data.stepType === "action") {
                const cmd: ExecuteStepCommand = {
                  attempt: 1,
                  stepName: event.data.stepName,
                  runId: event.runId ?? "run-id",
                  mcpId: event.data.tool,
                  args: event.data.args,
                  taskId: "task-id",
                };
                console.log(`[runner] executing command`);
                await engine.executeStep(cmd);
              }
              event as StepQueuedEvent;
            }

            // if (event.kind === "step.queued" && event.data.stepType === "action") {
            //   const event = event as ActionStep;

            //   const cmd: ExecuteStepCommand = {
            //     attempt: 1,
            //     stepName: event.stepName,
            //     runId: event.runId,
            //     mcpId: event.mcpId,
            //     taskId: "",
            //   };

            // }
          }
        }
      },
      async stop() {
        isRunning = false;
      },
    };
    return runner;
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
    const context = this.#runs.get(runId);
    const file =
      context?.outFile !== undefined ? context.outFile : "./output.json";

    fs.writeFileSync(file, JSON.stringify(context, null, 2));
    return;
  }
}
