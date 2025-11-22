import { Command } from "commander";
import { resolveCliPath } from "../../resolve-path.js";
import { WorkflowController } from "@lcase/controller";

export async function cliRunAction(
  controller: WorkflowController,
  flowPath: string
): Promise<void> {
  console.log("[cli] running run command");
  await controller.startRuntime();

  let isRunning = false;
  process.once("SIGINT", async () => {
    if (isRunning) await controller.stopRuntime();
    isRunning = false;
  });
  process.once("SIGTERM", async () => {
    if (isRunning) await controller.stopRuntime();
    isRunning = false;
  });
  process.once("exit", async () => {
    if (isRunning) await controller.stopRuntime();
    isRunning = false;
  });

  const resolvedFlowPath = resolveCliPath(flowPath);
  await controller.startFlow({ absoluteFilePath: resolvedFlowPath });
}

export function registerRunCmd(
  program: Command,
  controller: WorkflowController
): Command {
  program
    .command("run <flowPath>")
    .description("run a workflow definition from a flow.json file")
    .action(async (flowPath) => {
      await cliRunAction(controller, flowPath);
    });

  return program;
}
