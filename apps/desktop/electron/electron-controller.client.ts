import { FlowQueuedData } from "@pipewarp/types";
import { ControllerPort } from "@pipewarp/ports";


export class ElectronController implements ControllerPort {
  private get api() { 
    if (!window.electronAPI) {
      throw new Error("[electron-controller-client] no electronAPI on window");
    }
    return window.electronAPI;
  }
  async startFlow(input: FlowQueuedData): Promise<string | undefined> {
    this.api.invoke("controller:startFlow", input);
    return;
  }
  async startRuntime(): Promise<string> {
    console.log("[electron-controller-client] startRuntime() invoked");
    const result = await this.api.invoke("controller:startRuntime", {});

    if (result) {
      return "started"
    }
    return "not started";
  }
}