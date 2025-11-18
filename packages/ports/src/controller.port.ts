import type { FlowList } from "./flow/list.type.js";

export type RuntimeStatus = "stopped" | "running"
export interface ControllerPort {
  startFlow(args: { absoluteFilePath?: string }): Promise<string | undefined>;
  startRuntime(): Promise<RuntimeStatus>;
  stopRuntime(): Promise<RuntimeStatus>;
  listFlows(args: { absoluteDirPath?: string }): Promise<FlowList>;
  getFlowDir?(): Promise<string>;
}
