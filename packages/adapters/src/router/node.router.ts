import { EmitterFactory } from "@lcase/events";
import type { RouterPort, QueuePort, EventBusPort } from "@lcase/ports";
import type { AnyEvent, AnyJobEvent } from "@lcase/types";

export type RouterContext = {
  [capability: string]: {
    active: number;
    limit: number;
    readyQueue: string;
    waitingQueue: string;
  };
};
export class NodeRouter implements RouterPort {
  constructor(
    private readonly bus: EventBusPort,
    private readonly queue: QueuePort,
    private readonly ef: EmitterFactory
  ) {}
  async route(event: AnyEvent): Promise<void> {
    if (event === undefined || event.type === undefined) {
      console.error("[router] event or event type is undefined; event:", event);
      return;
    }
    if (event.domain === "job") {
      const e = event as AnyJobEvent;
      this.queue.enqueue(e.data.job.capability, event);
      const source = "lowercase://router/route/job";
      const jobEmitter = this.ef.newJobEmitterFromEvent(e, source);
      await jobEmitter.emit("job.queued", {
        job: e.data.job,
        status: "queued",
      });
    }
  }

  async start() {
    this.bus.subscribe("job.requested", async (e) => await this.route(e));
  }
  async stop() {
    this.bus.close();
  }
}
