import type {
  CloudScope,
  SystemScope,
  SystemEventType,
  SystemEventData,
  SystemEvent,
  SystemOtelAttributesMap,
} from "@lcase/types";
import type { OtelContext } from "../types.js";
import { BaseEmitter } from "./base.emitter.js";
import { EventBusPort } from "@lcase/ports";
import { systemOtelAttributesMap } from "../otel-attributes.js";
import { registry } from "../event-registry.js";

/**
 * strongly typed scoped emitter for engine events.
 * @see EmitterFactory for general usage with it
 *
 * registry should move out.
 */
export class SystemEmitter extends BaseEmitter {
  protected otel: OtelContext;
  protected systemOtelAttributesMap: SystemOtelAttributesMap;
  #systemScope: SystemScope;

  constructor(
    private readonly bus: EventBusPort,
    scope: OtelContext & SystemScope & CloudScope
  ) {
    const { traceId, spanId, traceParent, source } = scope;
    const { flowid, runid, stepid, jobid, toolid } = scope;

    super({ traceId, spanId, traceParent }, { source });

    this.otel = { traceId, spanId, traceParent };
    this.#systemScope = { flowid, runid, stepid, jobid, toolid };
    this.systemOtelAttributesMap = systemOtelAttributesMap;
    this.bus = bus;
  }

  async emit<T extends SystemEventType>(
    type: T,
    data: SystemEventData<T>
  ): Promise<void> {
    const event = {
      ...this.envelopeHeader(),
      ...this.#systemScope,
      data,
      type,
      domain: this.systemOtelAttributesMap[type].domain,
      action: this.systemOtelAttributesMap[type].action,
      ...(this.systemOtelAttributesMap[type].entity
        ? { entity: this.systemOtelAttributesMap[type].entity }
        : {}),
    } satisfies SystemEvent<T>;

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
