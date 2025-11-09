import type {
  CloudScope,
  ToolScope,
  ToolEventType,
  ToolEventData,
  ToolEvent,
  ToolOtelAttributesMap,
} from "@pipewarp/types";
import type { OtelContext } from "../types.js";
import { BaseEmitter } from "./base.emitter.js";
import { EventBusPort } from "@pipewarp/ports";
import { toolOtelAttributesMap } from "../otel-attributes.js";
import { registry } from "../event-registry.js";

/**
 * strongly typed scoped emitter for engine events.
 * @see EmitterFactory for general usage with it
 *
 * registry should move out.
 */
export class ToolEmitter extends BaseEmitter {
  protected otel: OtelContext;
  protected jobOtelAttributesMap: ToolOtelAttributesMap;
  #toolScope: ToolScope;

  constructor(
    private readonly bus: EventBusPort,
    scope: OtelContext & ToolScope & CloudScope
  ) {
    const { traceId, spanId, traceParent, source } = scope;
    const { flowid, runid, stepid, jobid, toolid } = scope;

    super({ traceId, spanId, traceParent }, { source });

    this.otel = { traceId, spanId, traceParent };
    this.#toolScope = { flowid, runid, stepid, jobid, toolid };
    this.jobOtelAttributesMap = toolOtelAttributesMap;
    this.bus = bus;
  }

  async emit<T extends ToolEventType>(
    type: T,
    data: ToolEventData<T>
  ): Promise<void> {
    const event = {
      ...this.envelopeHeader(),
      ...this.#toolScope,
      data,
      type,
      domain: this.jobOtelAttributesMap[type].domain,
      action: this.jobOtelAttributesMap[type].action,
      ...(this.jobOtelAttributesMap[type].entity
        ? { entity: this.jobOtelAttributesMap[type].entity }
        : {}),
    } satisfies ToolEvent<T>;

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
