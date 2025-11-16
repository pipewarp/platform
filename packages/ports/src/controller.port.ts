import { FlowQueuedData } from "@pipewarp/types";

export type RuntimeStatus = "stopped" | "running"
export interface ControllerPort {
  startFlow(input: FlowQueuedData): Promise<string | undefined>;
  startRuntime(): Promise<RuntimeStatus>;
  stopRuntime(): Promise<RuntimeStatus>;
}
