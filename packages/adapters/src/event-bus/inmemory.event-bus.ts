import { EventEmitter } from "events";
import type { EventBusPort } from "@pipewarp/ports";
import type { AnyEvent } from "@pipewarp/types";

export class InMemoryEventBus implements EventBusPort {
  #ee = new EventEmitter().setMaxListeners(0);
  constructor() {}

  /**
   * publish an event to a specific channel
   * @param topic bus channel "string" to publish to
   * @param event EventEnvelope to send on that channel
   * @returns Promise<void>
   * @description Uses the queueMicrotask to postpone emission slightly to
   * prefent recursive loops or having other emitions prempt the execution and
   * handling of this emition.
   *
   * Uses EventEmitter under the hood.
   */
  async publish(topic: string, event: AnyEvent): Promise<void> {
    console.log("[inmemory-bus] publish() called; topic, event:", topic, event);
    if (event == undefined || event.type == undefined) {
      console.error(
        "[inmemory-bus] cannot publish event. event or event.kind is undefined"
      );
      return;
    }

    const payload = Object.freeze(event);

    queueMicrotask(() => {
      try {
        this.#ee.emit(topic, payload);
      } catch (err) {
        console.error(`[bus.publish]: emit error '${topic}', event:${payload}`);
        console.error(err);
      }
    });
  }

  subscribe(
    topic: string,
    handler: (e: AnyEvent, t?: string) => Promise<void>
  ): () => unknown {
    console.log("[inmemory-bus] subscribe() called;");
    const safeHandler = (e: AnyEvent, t: string) => {
      try {
        handler(e, t ?? topic);
      } catch (err) {
        console.error(`[safeHandler] error event ${e}, topic ${t}`);
      }
    };
    this.#ee.on(topic, safeHandler);
    return () => this.#ee.off(topic, safeHandler);
  }
  async close(): Promise<unknown> {
    return this.#ee.removeAllListeners();
  }
}
