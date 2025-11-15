import type { ControllerPort } from "@pipewarp/ports";
import { RuntimeContext, WorkflowRuntime } from "@pipewarp/runtime";
import { FlowQueuedData } from "@pipewarp/types";



export class WorkflowController implements ControllerPort {

  constructor(private readonly runtime: WorkflowRuntime) { }

  async startFlow(input: FlowQueuedData): Promise<string | undefined> {
    await this.runtime.flow.startFlow(input);
    return;
  }

  async startRuntime() {
    await this.runtime.startRuntime();
  }

}