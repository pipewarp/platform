import type { Command } from "commander";
import { registerRunCmd } from "./run/run.cmd.js";
import { registerValidateCmd } from "./validate/validate.js";

export function registerCommands(program: Command) {
  registerRunCmd(program);
  registerValidateCmd(program);
}
