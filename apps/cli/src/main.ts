import { Command } from "commander";

async function main(): Promise<void> {
  const program = new Command();
  program.description("cli tool for pipewarp workflows");
  program.parse();

  console.log("pipewarp wip cli");
}

(async () => await main())();
