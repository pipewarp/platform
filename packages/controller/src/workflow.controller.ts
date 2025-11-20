import type {
  ServerControllerPort,
  EventSink,
  FlowList,
  RuntimeStatus,
} from "@lcase/ports";
import { WorkflowRuntime } from "@lcase/runtime";
import { FlowQueuedData } from "@lcase/types";

export class WorkflowController implements ServerControllerPort {
  constructor(private readonly runtime: WorkflowRuntime) {}

  async startFlow(args: {
    absoluteFilePath?: string;
  }): Promise<string | undefined> {
    await this.runtime.flow.startFlow(args);
    return;
  }

  async startRuntime(): Promise<RuntimeStatus> {
    return await this.runtime.startRuntime();
  }
  async stopRuntime(): Promise<RuntimeStatus> {
    return await this.runtime.stopRuntime();
  }
  async listFlows(args: { absoluteDirPath?: string }): Promise<FlowList> {
    if (args.absoluteDirPath === undefined) {
      throw new Error("[workflow-controller] listFlows directory undefined");
    }
    return await this.runtime.flow.listFlows(args);
  }
  attachSink(sink: EventSink) {
    this.runtime.attachSink(sink);
  }
}
