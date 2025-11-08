import type {
  StepEventType,
  StepEventData,
  StepScope,
  StepOtelAttributesMap,
  StepEvent,
  CloudScope,
} from "@pipewarp/types";
import type { OtelContext } from "../types.js";
import { BaseEmitter } from "./base.emitter.js";
import { EventBusPort } from "@pipewarp/ports";
import { stepOtelAttributes } from "../otel-attributes.js";
import { registry } from "../event-registry.js";

/**
 * strongly types scoped emitter for step events.
 * @see EmitterFactory for general usage with it
 *
 * currently does not wire up zod schema validation.
 * that should be moved to something that wires up zod schema
 * and bus topics.
 *
 * registry should move out but its not that bad.
 */
export class StepEmitter extends BaseEmitter {
  protected otel: OtelContext;
  protected stepOtelAttributes: StepOtelAttributesMap;
  #stepScope: StepScope;

  constructor(
    private readonly bus: EventBusPort,
    scope: CloudScope & StepScope & OtelContext
  ) {
    const { traceId, spanId, traceParent, source } = scope;
    const { flowid, runid, stepid, steptype } = scope;

    super({ traceId, spanId, traceParent }, { source });
    this.otel = { traceId, spanId, traceParent };
    this.#stepScope = { flowid, runid, stepid, steptype };
    this.stepOtelAttributes = stepOtelAttributes;
    this.bus = bus;
  }

  async emit<T extends StepEventType>(
    type: T,
    data: StepEventData<T>
  ): Promise<void> {
    const event = {
      ...this.envelopeHeader(),
      ...this.#stepScope,
      data,
      type,
      domain: this.stepOtelAttributes[type].domain,
      action: this.stepOtelAttributes[type].action,
      ...(this.stepOtelAttributes[type].entity
        ? { entity: this.stepOtelAttributes[type].entity }
        : {}),
    } satisfies StepEvent<T>;

    // console.log("event", JSON.stringify(event, null, 2));
    const entry = registry[type];
    // const result = entry.schema.event.safeParse(event);
    // if (result.error) {
    //   throw new Error(
    //     `[step-emitter] error parsing event; ${type}; ${result.error}`
    //   );
    // }
    await this.bus.publish(entry.topic, event);
  }
}
