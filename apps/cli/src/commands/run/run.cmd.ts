import { Command } from "commander";
import fs from "fs";
import { resolveCliPath } from "../../resolve-path.js";

import { type EventEnvelope } from "@pipewarp/ports";
import { FlowStore } from "@pipewarp/adapters/flow-store";
import { McpManager } from "@pipewarp/adapters/mcp-manager";
import { InMemoryEventBus } from "@pipewarp/adapters/event-bus";
import { InMemoryQueue } from "@pipewarp/adapters/queue";
import { NodeRouter } from "@pipewarp/adapters/router";
import { McpWorker } from "@pipewarp/adapters/worker";
import { InMemoryStreamRegistry } from "@pipewarp/adapters/stream";
import {
  Engine,
  wireStepHandlers,
  resolveStepArgs,
  PipeResolver,
} from "@pipewarp/engine";
import { startDemoServers } from "./demo.js";

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
  const stepHandlerRegistry = wireStepHandlers(
    bus,
    resolveStepArgs,
    pipeResolver
  );
  const mcpWorker = new McpWorker(queue, bus, mcpStore, streamRegistry);

  for await (const [mcpId] of mcpStore.mcps) {
    console.log(`[cli-run] starting worker (mcpid: ${mcpId})`);
    await mcpWorker.startMcp(mcpId);
  }

  await router.start();

  const engine = new Engine(
    flowStore,
    bus,
    streamRegistry,
    stepHandlerRegistry
  );

  const startFlow: EventEnvelope = {
    correlationId: "123-cid",
    id: "123-eid",
    time: new Date().toISOString(),
    kind: "flow.queued",
    data: {
      flowName: flow.name,
      inputs: { text: "text" },
      test,
      outfile: resolvedOutPath,
    },
  };

  process.on("SIGINT", async () => {
    if (demo) {
      await mcpWorker.stopMcp("unicode");
      await mcpWorker.stopMcp("transform");
    } else {
      await mcpWorker.stopMcp("stt-client");
    }
    queue.abortAll();
  });
  process.on("SIGTERM", async () => {
    if (demo) {
      await mcpWorker.stopMcp("unicode");
      await mcpWorker.stopMcp("transform");
    } else {
      await mcpWorker.stopMcp("stt-client");
    }
    mcpStore.close("unicode");
  });
  process.on("exit", async () => {
    if (demo) {
      await mcpWorker.stopMcp("unicode");
      await mcpWorker.stopMcp("transform");
    } else {
      await mcpWorker.stopMcp("stt-client");
    }
    queue.abortAll();
  });

  await bus.publish("flows.lifecycle", startFlow);
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
