import { WorkflowController } from "@lcase/controller";
import { createRuntime } from "@lcase/runtime";
import { runtimeConfig } from "./runtime-config.js";

export function bootstrap() {
  const runtime = createRuntime(runtimeConfig);
  const controller = new WorkflowController(runtime);
  return controller;
}
