import type { EventBusPort, EventSink } from "@lcase/ports";
import { AnyEvent } from "@lcase/types";

export class ObservabilityTap {
  #subscribeTopic = "observability";
  #sinks = new Map<string, EventSink>();

  constructor(private readonly bus: EventBusPort, sinks?: EventSink[]) {
    if (sinks) {
      for (const sink of sinks) {
        this.#sinks.set(sink.id, sink);
      }
    }
  }

  start() {
    this.bus.subscribe(this.#subscribeTopic, async (event: AnyEvent) => {
      for (const sink of this.#sinks.values()) {
        sink.handle(event);
      }
    });
  }

  attachSink(sink: EventSink) {
    this.#sinks.set(sink.id, sink);
  }

  detachSink(sink: EventSink) {
    this.#sinks.delete(sink.id);
  }
  stop() {
    try {
      this.bus.close();
    } catch (err) {
      console.log(`[observability-tap] could not close: ${err}`);
    }
  }
}
