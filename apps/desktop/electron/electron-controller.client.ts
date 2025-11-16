import { FlowQueuedData } from "@pipewarp/types";
import { ControllerClient } from "@pipewarp/ports";


export class ElectronControllerClient implements ControllerClient {
  private get api() { 
    if (!window.electronAPI) {
      throw new Error("[electron-controller-client] no electronAPI on window");
    }
    return window.electronAPI;
  }
  async startFlow(input: FlowQueuedData): Promise<void> {
    this.api.invoke("controller:startFlow", input);
  }
  async startRuntime(): Promise<void> {
    console.log("[electron-controller-client] startRuntime() invoked");
    this.api.invoke("controller:startRuntime", {});
  }
}