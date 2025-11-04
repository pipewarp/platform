import { Command } from "commander";
import fs from "fs";
import { resolveCliPath } from "../../resolve-path.js";

import { FlowStore } from "@pipewarp/adapters/flow-store";
import { McpManager } from "@pipewarp/adapters/mcp-manager";
import { InMemoryEventBus } from "@pipewarp/adapters/event-bus";
import { InMemoryQueue } from "@pipewarp/adapters/queue";
import { NodeRouter } from "@pipewarp/adapters/router";
import { McpWorker, Worker } from "@pipewarp/adapters/worker";
import { McpTool, ToolFactories, ToolRegistry } from "@pipewarp/adapters/tools";
import { InMemoryStreamRegistry } from "@pipewarp/adapters/stream";
import type { AnyEvent } from "@pipewarp/types";
import {
  Engine,
  wireStepHandlers,
  resolveStepArgs,
  PipeResolver,
  ResourceRegistry,
} from "@pipewarp/engine";
import { startDemoServers } from "./demo.js";
import { EmitterFactory } from "@pipewarp/events";

export async function cliRunAction(
  flowPath: string,
  options: { out?: string; test?: boolean; server?: string; demo?: boolean }
): Promise<void> {
  console.log("[cli-run] running run");
  console.log("[cli-run] options:", options);

  const {
    out = "./output.temp.json",
    test = false,
    server = "./src/mcp-server.ts",
    demo = false,
  } = options;

  const resolvedFlowPath = resolveCliPath(flowPath);
  const resolvedOutPath = resolveCliPath(out);
  const raw = fs.readFileSync(resolvedFlowPath, { encoding: "utf-8" });
  const json = JSON.parse(raw);

  const flowStore = new FlowStore();
  const { result, flow } = flowStore.validate(json);
  if (!result) {
    console.error(`[cli-run] Invaid flow at ${flowPath}`);
    return;
  }
  if (flow === undefined) {
    return;
  }
  flowStore.add(flow);

  const mcpStore = new McpManager();

  if (demo) {
    console.log("[cli-run] starting demo servers");
    const managedProcesses = await startDemoServers();

    if (!managedProcesses) {
      console.error("[cli-run] error starting servers for demo");
    }
    await mcpStore.addSseClient(
      "http://localhost:3004/sse",
      "unicode",
      "unicode-client",
      "0.1.0-alpha.1"
    );
    await mcpStore.addSseClient(
      "http://localhost:3005/sse",
      "transform",
      "transform-client",
      "0.1.0-alpha.1"
    );

    process.on("SIGINT", async () => {
      await mcpStore.close("unicode");
      await mcpStore.close("transform");
    });
    process.on("SIGTERM", async () => {
      await mcpStore.close("unicode");
      await mcpStore.close("transform");
    });
  } else {
    await mcpStore.addStdioClient(server, "stt-client");
  }

  const queue = new InMemoryQueue();
  const bus = new InMemoryEventBus();
  const router = new NodeRouter(bus, queue);
  const streamRegistry = new InMemoryStreamRegistry();
  const pipeResolver = new PipeResolver(streamRegistry);
  const stepHandlerRegistry = wireStepHandlers(resolveStepArgs, pipeResolver);
  const mcpWorker = new McpWorker(queue, bus, mcpStore, streamRegistry);

  for await (const [mcpId] of mcpStore.mcps) {
    console.log(`[cli-run] starting worker (mcpid: ${mcpId})`);
    await mcpWorker.startMcp(mcpId);
  }

  // setup new generic worker with tools
  const workerId = "cli-worker";
  const toolFactories: ToolFactories = {
    mcp: () => new McpTool(),
  };
  const toolRegistry = new ToolRegistry(toolFactories);
  const worker = new Worker(workerId, {
    bus,
    queue,
    toolRegistry,
    emitterFactory: new EmitterFactory(bus),
    streamRegistry,
  });

  worker.addCapability({
    name: "mcp",
    queueId: "mcp",
    maxJobCount: 2,
    tool: {
      id: "mcp",
      type: "inprocess",
    },
  });

  await router.start();

  const engine = new Engine(
    flowStore,
    bus,
    streamRegistry,
    stepHandlerRegistry,
    new ResourceRegistry(),
    new EmitterFactory(bus)
  );

  const startFlow: AnyEvent<"flow.queued"> = {
    correlationId: String(crypto.randomUUID()),
    id: String(crypto.randomUUID()),
    time: new Date().toISOString(),
    type: "flow.queued",
    flowId: flow.name,
    source: "/cli/cmd/run",
    specversion: "1.0",
    data: {
      flowName: flow.name,
      inputs: { text: "text" },
      test,
      outfile: resolvedOutPath,
    },
  };

  bus.subscribe("workers.lifecycle", async (e: AnyEvent) => {
    console.log("[cli] workers.lifecycle event:", e);
    if (e.type === "worker.registered") {
      const event = e as AnyEvent<"worker.registered">;
      if (
        event.data.workerId === workerId &&
        event.data.status === "accepted"
      ) {
        console.log(
          "[cli] received registration accepted, publishing flow event"
        );
        worker.start();
        await bus.publish("flows.lifecycle", startFlow);
      }
    }
  });

  process.on("SIGINT", async () => {
    if (demo) {
      await mcpWorker.stopMcp("unicode");
      await mcpWorker.stopMcp("transform");
    } else {
      await mcpWorker.stopMcp("stt-client");
      await worker.stopAllJobWaiters();
    }
    queue.abortAll();
  });
  process.on("SIGTERM", async () => {
    if (demo) {
      await mcpWorker.stopMcp("unicode");
      await mcpWorker.stopMcp("transform");
    } else {
      await mcpWorker.stopMcp("stt-client");
      await worker.stopAllJobWaiters();
    }
    queue.abortAll();
  });
  process.on("exit", async () => {
    if (demo) {
      await mcpWorker.stopMcp("unicode");
      await mcpWorker.stopMcp("transform");
    } else {
      await mcpWorker.stopMcp("stt-client");
      await worker.stopAllJobWaiters();
    }
    queue.abortAll();
  });

  await engine.start();
  await worker.requestRegistration();
}

export function registerRunCmd(program: Command): Command {
  program
    .command("run <flowPath>")
    .option("-o, --out <outPath>", "path to write output")
    .option("-t, --test", "run in test mode")
    .option("-d, --demo", "run preconfigured demo")
    .option("-s, --server <serverPath>", "stdio server path to connect to")
    .description("run a workflow definition from a flow.json file")
    .action(async (flowPath, options) => {
      await cliRunAction(flowPath, options);
    });

  return program;
}
