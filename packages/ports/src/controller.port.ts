import { FlowQueuedData } from "@pipewarp/types";
import type { FlowList } from "./flow/list.type.js";

export type RuntimeStatus = "stopped" | "running"
export interface ControllerPort {
  startFlow(input: FlowQueuedData): Promise<string | undefined>;
  startRuntime(): Promise<RuntimeStatus>;
  stopRuntime(): Promise<RuntimeStatus>;
  listFlows(args: {absoluteDirPath?: string}): Promise<FlowList>;
}
