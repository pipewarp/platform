import type { Command } from "commander";
import { registerRunCmd } from "./run/run.cmd.js";
import { registerValidateCmd } from "./validate/validate.js";
import { registerNewRunCmd } from "./run/new-run.cmd.js";
import { WorkflowController } from "@lcase/controller";

export function registerCommands(
  program: Command,
  controller: WorkflowController
) {
  registerRunCmd(program);
  registerNewRunCmd(program, controller);
  registerValidateCmd(program, controller);
}
