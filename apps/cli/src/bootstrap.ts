import { WorkflowController } from "@lcase/controller";
import { createRuntime } from "@lcase/runtime";
import { config } from "./runtime.config.js";

export function bootstrap() {
  const runtime = createRuntime(config);
  const controller = new WorkflowController(runtime);
  return controller;
}
