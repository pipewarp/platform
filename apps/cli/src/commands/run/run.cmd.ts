import { Command } from "commander";
import fs from "fs";
import { resolveCliPath } from "../../resolve-path.js";

import { FlowStore } from "@pipewarp/adapters/flow-store";
import { McpManager } from "@pipewarp/adapters/step-executor";
import { Engine } from "@pipewarp/engine";
import { StartFlowInput } from "@pipewarp/core/ports";

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

  // INIT_CWD is set by pnpm if invoked with pnpm
  // Resolve path this way to handle invocation from pnpm or directly

  const resolvedFlowPath = resolveCliPath(flowPath);
  const resolvedOutPath = resolveCliPath(out);

  // open json file
  const raw = fs.readFileSync(resolvedFlowPath, { encoding: "utf-8" });

  // parse json file
  const json = JSON.parse(raw);

  // add to flow db
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

  // make mcp manager
  const mcpStore = new McpManager();

  // create mcp client
  await mcpStore.addStdioClient(server, "stt-client");

  // create engine
  const engine = new Engine(flowStore, mcpStore);

  // start engine
  const input: StartFlowInput = {
    flowName: "stt-flow",
    correlationId: "temp-id",
    test,
    outfile: resolvedOutPath,
  };

  const response = await engine.startFlow(input);
  console.log(response);
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
