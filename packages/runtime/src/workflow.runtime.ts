import { FlowService, type Services } from "@pipewarp/services";
import { RuntimeContext } from "./types/runtime.context.js";


export class WorkflowRuntime { 
  flow: FlowService
  constructor(private readonly ctx: RuntimeContext, services: Services ) { 
    this.flow = services.flowService;
  }

  async startRuntime(): Promise<string>  {
    await this.ctx.router.start();
    
    for (const sink of Object.values(this.ctx.sinks)) {
      await sink.start()
    }
    this.ctx.tap.start();
  
    await this.ctx.engine.start();
    await this.ctx.worker.requestRegistration();

    return "started";
  };
};