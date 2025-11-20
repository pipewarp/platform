import fs from "fs";
import type { AnyEvent } from "@lcase/types";
import { Command } from "commander";
import { resolveCliPath } from "../../resolve-path.js";
import { startDemoServers } from "./demo.js";

import { McpManager } from "@lcase/adapters/mcp-manager";
import { EmitterFactory } from "@lcase/events";
import {
  makeRuntimeContext,
  createRuntime,
  type RuntimeConfig,
} from "@lcase/runtime";
import { WorkflowController } from "@lcase/controller";

export async function cliRunAction(
  flowPath: string,
  options: { out?: string; test?: boolean; server?: string; demo?: boolean }
): Promise<void> {
  const config: RuntimeConfig = {
    bus: {
      id: "",
      placement: "embedded",
      transport: "event-emitter",
      store: "none",
    },
    queue: {
      id: "",
      placement: "embedded",
      transport: "deferred-promise",
      store: "none",
    },
    router: {
      id: "",
    },
    engine: {
      id: "",
    },
    worker: {
      id: "default-worker",
      capabilities: [
        {
          name: "mcp",
          queueId: "mcp",
          maxJobCount: 2,
          tool: {
            id: "mcp",
            type: "inprocess",
          },
        },
      ],
    },
    stream: {
      id: "",
    },
    observability: {
      id: "",
      sinks: ["console-log-sink"],
    },
  };

  const ctx = makeRuntimeContext(config);
  const runtime = createRuntime(config);
  const controller = new WorkflowController(runtime);

  await controller.startRuntime();

  const cliEmitterFactory = new EmitterFactory(ctx.bus);
  const logEmitter = cliEmitterFactory.newSystemEmitter({
    source: "lowercase://cli/run",
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

  // const resolvedOutPath = resolveCliPath(out);
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
      "0.1.0-alpha.6"
    );
    await mcpStore.addSseClient(
      "http://localhost:3005/sse",
      "transform",
      "transform-client",
      "0.1.0-alpha.6"
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

  await logEmitter.emit("system.logged", {
    log: "[cli] running run command with options",
    payload: options,
  });

  await controller.startFlow({ absoluteFilePath: resolvedFlowPath });
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
