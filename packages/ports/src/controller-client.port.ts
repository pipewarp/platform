import { FlowQueuedData } from "@pipewarp/types";

export interface ControllerClient {
  startFlow(input: FlowQueuedData): Promise<void>;
  startRuntime(): Promise<string>;
}



