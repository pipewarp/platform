import type { ControllerPort } from "@pipewarp/ports";
import { RuntimeContext } from "@pipewarp/runtime";
import { FlowQueuedData } from "@pipewarp/types";



export class SystemController implements ControllerPort {

  constructor(private readonly runtime: RuntimeContext) { }

  async startFlow(input: FlowQueuedData): Promise<string | undefined> {
    return;
  }
}