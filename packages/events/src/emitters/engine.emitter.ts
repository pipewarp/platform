import type {
  EngineScope,
  CloudScope,
  EngineEventData,
  EngineEventType,
  EngineOtelAttributesMap,
  EngineEvent,
} from "@pipewarp/types";
import type { OtelContext } from "../types.js";
import { BaseEmitter } from "./base.emitter.js";
import { EventBusPort } from "@pipewarp/ports";
import { engineOtelAttributesMap } from "../otel-attributes.js";
import { registry } from "../event-registry.js";

/**
 * strongly typed scoped emitter for engine events.
 * @see EmitterFactory for general usage with it
 *
 * registry should move out.
 */
export class EngineEmitter extends BaseEmitter {
  protected otel: OtelContext;
  protected engineOtelAttributes: EngineOtelAttributesMap;
  #engineScope: EngineScope;

  constructor(
    private readonly bus: EventBusPort,
    scope: OtelContext & EngineScope & CloudScope
  ) {
    const { traceId, spanId, traceParent, source } = scope;
    const { engineid } = scope;

    super({ traceId, spanId, traceParent }, { source });

    this.otel = { traceId, spanId, traceParent };
    this.#engineScope = { engineid };
    this.engineOtelAttributes = engineOtelAttributesMap;
    this.bus = bus;
  }

  async emit<T extends EngineEventType>(
    type: T,
    data: EngineEventData<T>
  ): Promise<void> {
    const event = {
      ...this.envelopeHeader(),
      ...this.#engineScope,
      data,
      type,
      domain: this.engineOtelAttributes[type].domain,
      action: this.engineOtelAttributes[type].action,
      ...(this.engineOtelAttributes[type].entity
        ? { entity: this.engineOtelAttributes[type].entity }
        : {}),
    } satisfies EngineEvent<T>;

    // console.log("event", JSON.stringify(event, null, 2));
    const entry = registry[type];
    const result = entry.schema.event.safeParse(event);
    if (result.error) {
      throw new Error(
        `[flow-emitter] error parsing event; ${type}; ${result.error}`
      );
    }
    await this.bus.publish(entry.topic, event);
  }
}
