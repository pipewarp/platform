import { WorkflowController } from "@lcase/controller";
import { Command } from "commander";

export function registerNewRunCmd(
  program: Command,
  controller: WorkflowController
): Command {
  program
    .command("newrun <flowPath>")
    .description("new run a workflow definition from a flow.json file")
    .action(async (flowPath, options) => {
      await controller.startRuntime();

      // await cliRunAction(flowPath, options);
    });

  return program;
}
