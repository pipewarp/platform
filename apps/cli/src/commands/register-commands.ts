import type { Command } from "commander";
import { registerRunCmd } from "./run/run.cmd.js";

export function registerCommands(program: Command) {
  registerRunCmd(program);
}
