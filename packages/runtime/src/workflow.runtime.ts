import { FlowService, type Services } from "@pipewarp/services";
import { RuntimeContext } from "./types/runtime.context.js";
import { RuntimeStatus } from "@pipewarp/ports";


export class WorkflowRuntime { 
  flow: FlowService
  constructor(private readonly ctx: RuntimeContext, services: Services ) { 
    this.flow = services.flowService;
  }

  async startRuntime(): Promise<RuntimeStatus>  {
    try {
      await this.ctx.router.start();
    
      for (const sink of Object.values(this.ctx.sinks)) {
        await sink.start()
      }
      this.ctx.tap.start();
  
      await this.ctx.engine.start();
      await this.ctx.worker.start();
      await this.ctx.worker.requestRegistration();

      return "running";
    }
    catch {
      return "stopped";
    }
  };
  async stopRuntime(): Promise<RuntimeStatus> {
    try {
      await this.ctx.engine.stop();
      await this.ctx.worker.stopAllJobWaiters();
      
      for (const sink of Object.values(this.ctx.sinks)) {
        await sink.stop()
      }
      this.ctx.tap.stop();
      await this.ctx.router.stop();
      await this.ctx.bus.close();
      return "stopped";
    }
    catch (err) { 
      console.error(`[workflow-runtime] error stopping runtime ${err}`)
    }
    return "running";
  }
};