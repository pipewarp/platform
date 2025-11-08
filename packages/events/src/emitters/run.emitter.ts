import type {
  CloudScope,
  RunOtelAttributesMap,
  RunEventData,
  RunEventType,
  RunEvent,
  RunScope,
} from "@pipewarp/types";
import type { OtelContext } from "../types.js";
import { BaseEmitter } from "./base.emitter.js";
import { EventBusPort } from "@pipewarp/ports";
import { runOtelAttributesMap } from "../otel-attributes.js";
import { registry } from "../event-registry.js";

/**
 * strongly typed scoped emitter for engine events.
 * @see EmitterFactory for general usage with it
 *
 * registry should move out.
 */
export class RunEmitter extends BaseEmitter {
  protected otel: OtelContext;
  protected runOtelAttributesMap: RunOtelAttributesMap;
  #runScope: RunScope;

  constructor(
    private readonly bus: EventBusPort,
    scope: OtelContext & RunScope & CloudScope
  ) {
    const { traceId, spanId, traceParent, source } = scope;
    const { flowid, runid } = scope;

    super({ traceId, spanId, traceParent }, { source });

    this.otel = { traceId, spanId, traceParent };
    this.#runScope = { flowid, runid };
    this.runOtelAttributesMap = runOtelAttributesMap;
    this.bus = bus;
  }

  async emit<T extends RunEventType>(
    type: T,
    data: RunEventData<T>
  ): Promise<void> {
    const event = {
      ...this.envelopeHeader(),
      ...this.#runScope,
      data,
      type,
      domain: this.runOtelAttributesMap[type].domain,
      action: this.runOtelAttributesMap[type].action,
      ...(this.runOtelAttributesMap[type].entity
        ? { entity: this.runOtelAttributesMap[type].entity }
        : {}),
    } satisfies RunEvent<T>;

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
