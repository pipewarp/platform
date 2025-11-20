import { createRuntime, RuntimeConfig } from "@lcase/runtime";
import { WorkflowController } from "@lcase/controller";

// bootstrap the workflow runtime and workflow controller
export function bootstrap(config: RuntimeConfig): {
  controller: WorkflowController;
} {
  const runtime = createRuntime(config);
  const controller = new WorkflowController(runtime);
  return { controller };
}
