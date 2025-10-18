import { Command } from "commander";
import fs from "fs";
import { resolveCliPath } from "../../resolve-path.js";

import { type EventEnvelope } from "@pipewarp/ports";
import { FlowStore } from "@pipewarp/adapters/flow-store";
import { McpManager } from "@pipewarp/adapters/step-executor";
import { InMemoryEventBus } from "@pipewarp/adapters/event-bus";
import { InMemoryQueue } from "@pipewarp/adapters/queue";
import { NodeRouter } from "@pipewarp/adapters/router";
import { McpWorker } from "@pipewarp/adapters/worker";
import { Engine } from "@pipewarp/engine";

export async function cliRunAction(
  flowPath: string,
  options: { out?: string; test?: boolean; server?: string }
): Promise<void> {
  console.log("running run");
  console.log("options", options);

  const {
    out = "./output.json",
    test = false,
    server = "./src/mcp-server.ts",
  } = options;

  const resolvedFlowPath = resolveCliPath(flowPath);
  const resolvedOutPath = resolveCliPath(out);

  const raw = fs.readFileSync(resolvedFlowPath, { encoding: "utf-8" });
  const json = JSON.parse(raw);

  const flowStore = new FlowStore();
  const { result, flow } = flowStore.validate(json);
  if (!result) {
    console.error(`Invaid flow at ${flowPath}`);
    return;
  }
  if (flow === undefined) {
    return;
  }
  flowStore.add(flow);

  const mcpStore = new McpManager();
  // await mcpStore.addStdioClient(server, "stt-client");
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

  const queue = new InMemoryQueue();
  const bus = new InMemoryEventBus();
  const router = new NodeRouter(bus, queue);

  const mcpWorker = new McpWorker(queue, bus, mcpStore);

  for await (const [mcpId] of mcpStore.mcps) {
    console.log(`starting mcpid: ${mcpId}`);
    await mcpWorker.startMcp(mcpId);
  }

  await router.start();

  const engine = new Engine(flowStore, bus);

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

  await bus.publish("flows.lifecycle", startFlow);
}

export function registerRunCmd(program: Command): Command {
  program
    .command("run <flowPath>")
    .option("-o, --out <outPath>", "path to write output")
    .option("-t, --test", "run in test mode")
    .option("-s, --server <serverPath>", "stdio server path to connect to")
    .description("run a workflow definition from a flow.json file")
    .action(cliRunAction);

  return program;
}
