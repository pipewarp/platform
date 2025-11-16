#!/usr/bin/env node
import { Command } from "commander";
import { registerCommands } from "./commands/register-commands.js";
import { bootstrap } from "./bootstrap.js";

async function main(): Promise<void> {

  const controller = bootstrap();
  const program = new Command();
  program.description("cli tool for pipewarp workflows");
  registerCommands(program, controller);
  program.parseAsync();
}

(async () => await main())();
