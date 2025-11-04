import {
  ConsumerStreamPort,
  ProducerStreamPort,
  StreamRegistryPort,
} from "@pipewarp/ports";
import { ToolRegistry } from "../../tools/tool-registry.js";
import type { JobContext } from "../types.js";

export type JobExecutorDeps = {
  toolRegistry: ToolRegistry;
  streamRegistry: StreamRegistryPort;
};

/**
 * Uses job context and registry to pick the tool per capability.
 * Also sets up streaming handles based on the job context.
 *
 * Finally actually invokes the tool and returns its results.
 *
 */
export class JobExecutor {
  constructor(
    private job: JobContext,
    private readonly deps: JobExecutorDeps
  ) {}

  async run(): Promise<unknown> {
    this.job.status = "running";
    const tool = this.deps.toolRegistry.resolve(
      this.job.capabilitiy,
      this.job.description.key
    );

    let consumer: ConsumerStreamPort | undefined;
    let producer: ProducerStreamPort | undefined;
    if (this.job.description.isConsumer) {
      if (!this.job.description.streamId) {
        throw new Error("[worker-job-executor] no stream id set for consumer");
      }
      consumer = this.deps.streamRegistry.getConsumer(
        this.job.description.streamId
      );
    }
    if (this.job.description.isProducer) {
      if (!this.job.description.streamId) {
        throw new Error("[worker-job-executor] no stream id set for producer");
      }
      producer = this.deps.streamRegistry.getProducer(
        this.job.description.streamId
      );
    }

    const result = await tool.invoke(this.job.description.data, {
      flowId: this.job.metadata.flowId,
      runId: this.job.metadata.runId,
      stepId: this.job.metadata.stepId,
      capability: this.job.capabilitiy,
      workerId: this.job.id,
      ...(consumer ? { consumer } : {}),
      ...(producer ? { producer } : {}),
    });

    return result;
  }
}
