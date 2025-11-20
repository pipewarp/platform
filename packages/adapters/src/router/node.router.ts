import type { RouterPort, QueuePort, EventBusPort } from "@lcase/ports";
import type { AnyEvent } from "@lcase/types";

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
    private readonly queue: QueuePort
  ) {}
  async route(event: AnyEvent): Promise<void> {
    console.log("[router] route() called;");
    if (event === undefined || event.type === undefined) {
      console.error(
        "[router] cannot route; event is undefined or kind is undefined; event:",
        event
      );
      return;
    }

    if (event.type === "job.mcp.queued") {
      const e = event as AnyEvent<"job.mcp.queued">;
      this.queue.enqueue(e.data.job.capability, event);
    }
  }

  async start() {
    this.bus.subscribe("jobs.lifecycle", async (e) => await this.route(e));
  }
  async stop() {
    this.bus.close();
  }
}
