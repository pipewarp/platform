import type { RouterPort, QueuePort, EventBusPort } from "@pipewarp/ports";
import type { AnyEvent } from "@pipewarp/types";

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

    if (event.type === "step.action.queued") {
      const e = event as AnyEvent<"step.action.queued">;
      this.queue.enqueue(e.data.tool, event);
    }
  }

  async start() {
    this.bus.subscribe("steps.lifecycle", async (e) => await this.route(e));
  }
  async stop() {
    this.bus.close();
  }
}
