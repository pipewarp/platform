import { Command } from "commander";
import fs from "fs";
import { cwd } from "process";
import { resolve } from "path";

import { FlowStore } from "@pipewarp/adapters/flow-store";
import { McpManager } from "@pipewarp/adapters/step-executor";
import { Engine } from "@pipewarp/engine";
import { StartFlowInput } from "@pipewarp/core/ports";
export async function cliRunAction(
  flowPath: string,
  outPath: string
): Promise<void> {
  console.log("running run");
  const resolvedFlowPath = resolve(cwd(), flowPath);
  const resolvedOutPath = resolve(cwd(), flowPath);
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
  await mcpStore.addStdioClient("./src/mcp-server.ts", "stt-client");

  // create engine
  const engine = new Engine(flowStore, mcpStore);

  // start engine
  const input: StartFlowInput = {
    flowName: "stt-flow",
    correlationId: "temp-id",
  };

  const response = await engine.startFlow(input);
  console.log(response);
}

export function registerRunCmd(program: Command): Command {
  program
    .command("run <flowPath>")
    .option("-o, --out <outPath>", "path to write output")
    .description("run a workflow definition from a flow.json file")
    .action(cliRunAction);

  return program;
}
