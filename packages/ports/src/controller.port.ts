import { FlowQueuedData } from "@pipewarp/types";



export interface ControllerPort {
  startFlow(input: FlowQueuedData): Promise<string | undefined>;
  startRuntime(): Promise<string>;
}
