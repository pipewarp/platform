
import { ControllerPort, FlowList, RuntimeStatus } from "@pipewarp/ports";

// TODO: implement type mapping on API invoke channels
export class ElectronController implements ControllerPort {
  private get api() { 
    if (!window.electronAPI) {
      throw new Error("[electron-controller-client] no electronAPI on window");
    }
    return window.electronAPI;
  }
  async startFlow(args: { absoluteFilePath?: string }): Promise<string | undefined> {
    this.api.invoke("controller:startFlow", args);
    return;
  }
  async startRuntime(): Promise<RuntimeStatus> {
    console.log("[electron-controller-client] startRuntime() invoked");
    const result = await this.api.invoke("controller:startRuntime", {});

    if (result === "running") return "running"
    return "stopped";
  }
  async stopRuntime(): Promise<RuntimeStatus> {
    const result = await this.api.invoke("controller:stopRuntime", {});

    if (result === "stopped") return "stopped"
    return "running";
  }
  async listFlows(args: { absoluteDirPath?: string; }): Promise<FlowList> {
    console.log("[electron-controller] listFlows() args:", args);
    const result = await this.api.invoke("controller:listFlows", args);
    return result as FlowList;
  
  } 
  async getFlowDir(): Promise<string> {
    const result = await this.api.invoke("controller:pickFlowDir", undefined) as string[]
    return result[0];
  }
}