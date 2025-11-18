import type { EventBusPort, FlowStorePort, FlowList } from "@pipewarp/ports";
import type { FlowQueuedData } from "@pipewarp/types";
import { EmitterFactory } from "@pipewarp/events";
import { FlowSchema, type Flow } from "@pipewarp/specs";
import { createHash } from "crypto";
import path from "node:path";

export class FlowService { 
  constructor(private readonly bus: EventBusPort, private readonly ef: EmitterFactory, private readonly flowStore: FlowStorePort) { }
  
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

  async listFlows(args: {absoluteDirPath?: string}): Promise<FlowList> {
    const flows = this.flowStore.readFlows({ dir: args.absoluteDirPath });

    const flowList: FlowList = {
      validFlows: {},
      invalidFlows: {},
    };

    for (const [absolutePath, blob] of flows.entries()) { 
      const flow = this.validateJsonFlow(blob);
      if (typeof flow === "string") {
        flowList.invalidFlows[absolutePath] = { errorMessage: flow };
      }
      else {
        flowList.validFlows[this.makeId(flow.name, flow.version, absolutePath)] = {
          ...(flow.description ? { description: flow.description } : {}),
          filename: path.basename(absolutePath),
          name: flow.name,
          version: flow.version,
          absolutePath
        }
      }
    }
    return flowList;
  }


  validateJsonFlow(blob: unknown): Flow | string {
    if (blob === undefined) return "Invalid flow: Undefined";
    try {
      const flow = JSON.parse(blob as string);
      const result = FlowSchema.safeParse(flow);
      if (!result.success) {
        return JSON.stringify(result.error, null, 2);
      }
      return result.data;
    }
    catch (err) {
      return `Invalid flow: Error parsing Json: ${err}"`;
    }

  }

  makeId(name: string, version: string, path?: string, p0?: {}): string { 
    const hash = createHash("md5");
    hash.update(name + version + path);
    return hash.digest("hex");
  }
}