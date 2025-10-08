import { Command } from "commander";
import fs from "fs";
import { cwd } from "process";
import { resolve } from "path";

import { FlowSchema } from "@pipewarp/core/types";

export function cliValidateAction(flowPath: string) {
  const resolvedFlowPath = resolve(cwd(), flowPath);
  const raw = fs.readFileSync(resolvedFlowPath, { encoding: "utf-8" });

  try {
    const json = JSON.parse(raw);
    const result = FlowSchema.safeParse(json);
    if (result.error) {
      console.log("Invalid");
      console.log("Reason:", result.error.errors);
      return;
    }
    console.log("Valid");
  } catch (e) {
    console.log("Invalid");
    console.log("Error:", e);
  }
}
export function registerValidateCmd(program: Command): Command {
  program.command("validate <flowPath>").action(cliValidateAction);
  return program;
}
