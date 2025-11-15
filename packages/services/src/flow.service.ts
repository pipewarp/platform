import type { EventBusPort } from "@pipewarp/ports";
import type { FlowQueuedData } from "@pipewarp/types";
import { EmitterFactory } from "@pipewarp/events";


export class FlowService { 
  constructor(private readonly bus: EventBusPort, private readonly ef: EmitterFactory) { }
  
  async startFlow(data: FlowQueuedData): Promise<void> { 

    const traceId = this.ef.generateTraceId();
    const spanId = this.ef.generateSpanId();
    const traceParent = this.ef.makeTraceParent(traceId, spanId);

    const flowEmitter = this.ef.newFlowEmitter({
      source: "pipewarp://flow-service/start-flow",
      flowid: data.flow.id,
      traceId,
      spanId,
      traceParent,
    });
    await flowEmitter.emit("flow.queued", data);
    
  };
}