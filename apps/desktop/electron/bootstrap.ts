import { createRuntime, RuntimeConfig} from "@pipewarp/runtime";
import { WorkflowController } from "@pipewarp/controller";


// bootstrap the workflow runtime and workflow controller
export function bootstrap(config: RuntimeConfig): { controller: WorkflowController } { 
  
  const runtime = createRuntime(config);
  const controller = new WorkflowController(runtime);
  return { controller }
}


