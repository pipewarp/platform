import type { RouterPort, QueuePort, EventBusPort } from "@pipewarp/ports";
import type { EventEnvelope } from "@pipewarp/types";

export class NodeRouter implements RouterPort {
  constructor(
    private readonly bus: EventBusPort,
    private readonly queue: QueuePort
  ) {}
  async route(event: EventEnvelope): Promise<void> {
    console.log("[router] route() called;");
    if (event === undefined || event.kind === undefined) {
      console.error(
        "[router] cannot route; event is undefined or kind is undefined; event:",
        event
      );
      return;
    }

    if (event.kind === "step.queued" && event.data.stepType === "action") {
      this.queue.enqueue(event.data.tool, event);
    }
  }

  async start() {
    this.bus.subscribe("steps.lifecycle", async (e) => await this.route(e));
  }
  async stop() {
    this.bus.close();
  }
}
