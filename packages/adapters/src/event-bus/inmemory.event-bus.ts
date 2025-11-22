import { EventEmitter } from "events";
import type { EventBusPort, PublishOptions } from "@lcase/ports";
import type { AnyEvent } from "@lcase/types";

export class InMemoryEventBus implements EventBusPort {
  #ee = new EventEmitter().setMaxListeners(0);
  #hasObservability = false;
  observabilityTopic = "observability";

  constructor() {}

  /**
   * publish an event to a specific channel
   * @param topic bus channel "string" to publish to
   * @param event EventEnvelope to send on that channel
   * @returns Promise<void>
   * @description Uses the queueMicrotask to postpone emission slightly to
   * prevent recursive loops or having other emitions preempt the execution and
   * handling of this emition.
   *
   * Uses Node's EventEmitter under the hood.
   */
  async publish(
    topic: string,
    event: AnyEvent,
    options: PublishOptions
  ): Promise<void> {
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

        if (this.observabilityTopic && !options?.internal) {
          this.#ee.emit(this.observabilityTopic, payload);
        }
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
    if (topic === this.observabilityTopic) this.#hasObservability = true;
    const safeHandler = (e: AnyEvent, t: string) => {
      try {
        handler(e, t ?? topic);
      } catch (err) {
        console.error(`[safeHandler] error event ${e}, topic ${t}`);
      }
    };
    this.#ee.on(topic, safeHandler);
    return () => {
      if (topic === this.observabilityTopic) this.#hasObservability = false;
      this.#ee.off(topic, safeHandler);
    };
  }
  async close(): Promise<unknown> {
    this.#hasObservability = false;
    return this.#ee.removeAllListeners();
  }
}
