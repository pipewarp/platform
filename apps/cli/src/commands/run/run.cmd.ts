import fs from "fs";
import type { AnyEvent } from "@pipewarp/types";
import { Command } from "commander";
import { resolveCliPath } from "../../resolve-path.js";
import { startDemoServers } from "./demo.js";

import { McpManager } from "@pipewarp/adapters/mcp-manager";
import { EmitterFactory } from "@pipewarp/events";
import { makeRuntimeContext, createRuntime, type RuntimeConfig} from "@pipewarp/runtime";

export async function cliRunAction(
  flowPath: string,
  options: { out?: string; test?: boolean; server?: string; demo?: boolean }
): Promise<void> {

  const config: RuntimeConfig = {
    bus: {
      id: "",
      placement: "embedded",
      transport: "event-emitter",
      store: "none"
    },
    queue: {
      id: "",
      placement: "embedded",
      transport: "deferred-promise",
      store: "none"
    },
    router: {
      id: ""
    },
    engine: {
      id: ""
    },
    worker: {
      id: "default-worker",
      capabilities: [{
        name: "mcp",
        queueId: "mcp",
        maxJobCount: 2,
        tool: {
          id: "mcp",
          type: "inprocess",
        },
      }]
    },
    stream: {
      id: ""
    },
    observability: {
      id: "",
      sinks: ["console-log-sink", "websocket-sink"],
      webSocketPort: 3006
    },
  }


  const ctx = makeRuntimeContext(config);
  const runtime = createRuntime(config);

  const cliEmitterFactory = new EmitterFactory(ctx.bus);
  const logEmitter = cliEmitterFactory.newSystemEmitter({
    source: "pipewarp://cli/run",
    traceId: "",
    spanId: "",
    traceParent: "",
  });

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

  const { result, flow } = ctx.flowStore.validate(json);
  if (!result) {
    console.error(`[cli-run] Invaid flow at ${flowPath}`);
    return;
  }
  if (flow === undefined) {
    return;
  }
  ctx.flowStore.add(flow);

  const mcpStore = new McpManager();

  if (demo) {
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

  // setup new generic worker with tools
  
  


  const traceId = cliEmitterFactory.generateTraceId();
  const spanId = cliEmitterFactory.generateSpanId();
  const traceParent = cliEmitterFactory.makeTraceParent(traceId, spanId);
  const flowId = String(crypto.randomUUID());
  const flowEmitter = cliEmitterFactory.newFlowEmitter({
    source: "pipewarp://cli/run",
    flowid: flowId,
    traceId,
    spanId,
    traceParent,
  });

  ctx.bus.subscribe("workers.lifecycle", async (e: AnyEvent) => {
    if (e.type === "worker.registered") {
      const event = e as AnyEvent<"worker.registered">;
      if (
        event.data.workerId === "default-worker" &&
        event.data.status === "accepted"
      ) {
        await ctx.worker.start();
        await flowEmitter.emit("flow.queued", {
          flowName: flow.name,
          outfile: resolvedOutPath,
          inputs: { text: "text" },
          test,
          flow: {
            id: flowId,
            name: flow.name,
            version: flow.version,
          },
          definition: {},
        });
      }
    }

    ctx.bus.subscribe("flows.lifecycle", async (e: AnyEvent) => {
      if (e.type === "flow.completed") {
        process.emit("SIGINT");
      }
    });
  });

  process.on("SIGINT", async () => {
    await ctx.worker.stopAllJobWaiters();
    ctx.queue.abortAll();
    await ctx.engine.stop();
  });
  process.on("SIGTERM", async () => {
    await ctx.worker.stopAllJobWaiters();
    ctx.queue.abortAll();
  });
  process.on("exit", async () => {
    await ctx.worker.stopAllJobWaiters();
    ctx.queue.abortAll();
  });

  
  console.log("\nWaiting on Observability WebSocket Client");
  await runtime.startRuntime();

  await logEmitter.emit("system.logged", {
      log: "[cli] running run command with options",
      payload: options,
    });

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
