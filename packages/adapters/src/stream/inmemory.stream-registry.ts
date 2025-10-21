import { InMemoryStreamCore } from "./internal/inmemory.stream-core.js";
import { makeProducerView, makeConsumerView } from "./internal/views.js";
import type {
  ConsumerStreamPort,
  ProducerStreamPort,
  StreamHandles,
  StreamRegistryPort,
} from "@pipewarp/ports";

// currently immports InMemoryStream core for depedency.
// NOTE: let registry accept a *factory* arg; createCore(id, options) -> Core
// plug in different cores (redis, kafka, etc) without touching callers.
// DI through tiny function to create the Core instead of importing for
// other cores.

export class InMemoryStreamRegistry implements StreamRegistryPort {
  #registry = new Map<
    string,
    { p: ProducerStreamPort; c: ConsumerStreamPort }
  >();
  constructor() {}

  createStream(streamId: string): StreamHandles {
    const streamCore = new InMemoryStreamCore(streamId, "idle"); // later move to factory function for DI

    const consumer = makeConsumerView(streamCore);
    const producer = makeProducerView(streamCore);

    this.#registry.set(streamId, { p: producer, c: consumer });
    const { p, c } = this.#registry.get(streamId)!;

    return { id: streamId, consumer, producer };
  }
  getProducer(streamId: string): ProducerStreamPort {
    if (!this.#registry.has(streamId)) {
      throw new Error(`[stream-registry] no registry for id:${streamId}`);
    }
    if (this.#registry.get(streamId) === undefined) {
      const msg = `[stream-registry] registry is undefined for ${streamId}`;
      throw new Error(msg);
    }
    const { p } = this.#registry.get(streamId)!; // just checked undefined
    return p;
  }
  getConsumer(streamId: string): ConsumerStreamPort {
    if (!this.#registry.has(streamId)) {
      throw new Error(`[stream-registry] no registry for id:${streamId}`);
    }
    if (this.#registry.get(streamId) === undefined) {
      const msg = `[stream-registry] registry is undefined for ${streamId}`;
      throw new Error(msg);
    }
    const { c } = this.#registry.get(streamId)!; // just checked undefined
    return c;
  }
  closeStream(streamId: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
