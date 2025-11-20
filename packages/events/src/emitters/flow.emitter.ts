import type {
  FlowEventType,
  FlowEventData,
  FlowOtelAttributesMap,
  FlowScope,
  CloudScope,
  FlowEvent,
} from "@lcase/types";
import type { OtelContext } from "../types.js";
import { BaseEmitter } from "./base.emitter.js";
import { EventBusPort } from "@lcase/ports";
import { flowOtelAttributes } from "../otel-attributes.js";
import { registry } from "../event-registry.js";

/**
 * strongly types scoped emitter for step events.
 * @see EmitterFactory for general usage with it
 *
 * registry should move out eventually
 */
export class FlowEmitter extends BaseEmitter {
  protected otel: OtelContext;
  protected flowOtelAttributes: FlowOtelAttributesMap;
  #flowScope: FlowScope;

  constructor(
    private readonly bus: EventBusPort,
    scope: OtelContext & FlowScope & CloudScope
  ) {
    const { traceId, spanId, traceParent, source } = scope;
    const { flowid } = scope;

    super({ traceId, spanId, traceParent }, { source });

    this.otel = { traceId, spanId, traceParent };
    this.#flowScope = { flowid };
    this.flowOtelAttributes = flowOtelAttributes;
    this.bus = bus;
  }

  async emit<T extends FlowEventType>(
    type: T,
    data: FlowEventData<T>
  ): Promise<void> {
    const event = {
      ...this.envelopeHeader(),
      ...this.#flowScope,
      data,
      type,
      domain: this.flowOtelAttributes[type].domain,
      action: this.flowOtelAttributes[type].action,
      ...(this.flowOtelAttributes[type].entity
        ? { entity: this.flowOtelAttributes[type].entity }
        : {}),
    } satisfies FlowEvent<T>;

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
