import type {
  RouterPort,
  EventEnvelope,
  QueuePort,
  EventBusPort,
} from "@pipewarp/ports";

export class Router implements RouterPort {
  constructor(
    private readonly bus: EventBusPort,
    private readonly queue: QueuePort
  ) {}
  async route(event: EventEnvelope): Promise<void> {
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
    this.bus.subscribe("step.lifecycle", (e) => this.route(e));
  }
  async stop() {
    this.bus.close();
  }
}
