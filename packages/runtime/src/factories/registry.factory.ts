import type { Registry } from "../types/registry.js";
import { busRegistry } from "../registries/bus.registry.js";
import { queueRegistry } from "../registries/queue.registry.js";

export function makeRegistryFactory<R extends Registry>(registry: R) {
  return function createFactory<
    P extends keyof R,
    T extends keyof R[P],
    S extends keyof R[P][T]
  >(placement: P, transport: T, store: S): R[P][T][S] {
    const placementRegistry = registry[placement];
    if (!placementRegistry) {
      throw new Error(
        `[runtime] no registry for placement ${String(placement)}`
      );
    }

    const transportRegistry = placementRegistry[transport];
    if (!transportRegistry) {
      throw new Error(
        `[runtime] no registry for transport ${String(transport)}`
      );
    }

    const factory = transportRegistry[store];
    if (!factory) {
      // if (!factory || typeof factory !== "function") {
      throw new Error(`[runtime] no registry for store ${String(store)}`);
    }

    return factory;
  };
}

export const makeQueueFactory = makeRegistryFactory(queueRegistry);
export const makeBusFactory = makeRegistryFactory(busRegistry);
