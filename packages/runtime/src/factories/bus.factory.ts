import {
  busRegistry,
  type BusRegistry,
  type BusPlacement,
  type BusTransport,
  type BusStore,
} from "../registries/bus.registry.js";
import { Registry } from "../types/registry.js";

/**
 * Used to help automate the creation of busses which can be configured to
 * embedded or remote (placement), use nodes event-emitter or redis (transport),
 * and durably store data in jsonl, sqlite, or not at all (store)
 *
 * Uses a busRegistry under the hood, which maps these parameters to object
 * creation in an object.
 *
 * @example
 * ```
 * const busFactory = createBusFactory("embedded", "event-emitter", "jsonl");
 * const bus = busFactory(args);
 * ```
 *
 * @param placement BusPlacement
 * @param transport BusTransport
 * @param store BusStore
 * @returns factory function to create the correct bus based on the three axis
 */
export function createBusFactory<
  P extends BusPlacement,
  T extends BusTransport,
  S extends BusStore
>(placement: P, transport: T, store: S): BusRegistry[P][T][S] {
  const registry = busRegistry;
  const placementRegistry = registry[placement];
  if (!placementRegistry) {
    throw new Error(`[runtime] no registry for placement ${String(placement)}`);
  }

  const transportRegistry = placementRegistry[transport];
  if (!transportRegistry) {
    throw new Error(`[runtime] no registry for transport ${String(transport)}`);
  }

  const factory = transportRegistry[store];
  if (!factory) {
    // if (!factory || typeof factory !== "function") {
    throw new Error(`[runtime] no registry for store ${String(store)}`);
  }

  return factory;
}

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
