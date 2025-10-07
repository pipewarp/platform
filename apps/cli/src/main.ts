#!/usr/bin/env node
import { Command } from "commander";
import { registerCommands } from "./commands/register-commands.js";

async function main(): Promise<void> {
  const program = new Command();
  program.description("cli tool for pipewarp workflows");
  registerCommands(program);
  program.parseAsync();

  console.log("pipewarp wip cli");
}

(async () => await main())();
