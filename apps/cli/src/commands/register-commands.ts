import type { Command } from "commander";
import { registerRunCmd } from "./run/run.cmd.js";
import { registerValidateCmd } from "./validate/validate.js";
import { registerRunDemoCmd } from "./run/run-demo.cmd.js";
import { WorkflowController } from "@lcase/controller";

export function registerCommands(
  program: Command,
  controller: WorkflowController
) {
  registerRunCmd(program, controller);
  registerRunDemoCmd(program, controller);
  registerValidateCmd(program, controller);
}
