import { EventEmitter } from "events";
import { EventBusPort } from "../../../core/src/ports/event-bus.port.js";
import { EventEnvelope } from "../../../core/src/types/event-bus.types.js";

export class InMemoryEventBus implements EventBusPort {
  #ee = new EventEmitter().setMaxListeners(0);
  constructor() {}

  /**
   * publish an event to a specific channel
   * @param topic bus channel "string" to publish to
   * @param event EventEvenlope to send on that channel
   * @returns Promise<void>
   * @description Uses the queueMicrotask to postpone emission slightly to
   * prefent recursive loops or having other emitions prempt the execution and
   * handling of this emition.
   *
   * Uses EventEmitter under the hood.
   */
  async publish(topic: string, event: EventEnvelope): Promise<void> {
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
    handler: (e: EventEnvelope, t?: string) => Promise<void>
  ): () => unknown {
    const safeHandler = (e: EventEnvelope, t: string) => {
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
