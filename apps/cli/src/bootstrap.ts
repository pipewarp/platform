import { WorkflowController } from "@pipewarp/controller";
import { createRuntime } from "@pipewarp/runtime";
import { runtimeConfig } from "./runtime-config.js";


export function bootstrap() {
  const runtime = createRuntime(runtimeConfig);
  const controller = new WorkflowController(runtime);
  return controller;
}