import { InMemoryStreamCore } from "./inmemory.stream-core.js";
import type {
  Chunk,
  ConsumerStreamPort,
  ProducerStreamPort,
} from "@pipewarp/ports";

// TODO: implement revoked flag that throws on each method if true

export function makeProducerView(
  core: InMemoryStreamCore
): Readonly<ProducerStreamPort> {
  const producer: ProducerStreamPort = {
    send: async (data: Chunk) => await core.send(data),
    close: async () => await core.close(),
    status: () => core.status(),
    id: () => core.id(),
    end: () => core.end(),
  };

  return Object.freeze(producer);
}

export function makeConsumerView(
  core: InMemoryStreamCore
): Readonly<ConsumerStreamPort> {
  const consumer: ConsumerStreamPort = {
    subscribe: () => core.subscribe(),
    close: async () => await core.close(),
    status: () => core.status(),
    id: () => core.id(),
  };
  return Object.freeze(consumer);
}
