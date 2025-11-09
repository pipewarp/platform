import type {
  CloudScope,
  JobScope,
  JobOtelAttributesMap,
  JobEventType,
  JobEventData,
  JobEvent,
} from "@pipewarp/types";
import type { OtelContext } from "../types.js";
import { BaseEmitter } from "./base.emitter.js";
import { EventBusPort } from "@pipewarp/ports";
import { jobOtelAttributesMap } from "../otel-attributes.js";
import { registry } from "../event-registry.js";

/**
 * strongly typed scoped emitter for engine events.
 * @see EmitterFactory for general usage with it
 *
 * registry should move out.
 */
export class JobEmitter extends BaseEmitter {
  protected otel: OtelContext;
  protected jobOtelAttributesMap: JobOtelAttributesMap;
  #jobScope: JobScope;

  constructor(
    private readonly bus: EventBusPort,
    scope: OtelContext & JobScope & CloudScope
  ) {
    const { traceId, spanId, traceParent, source } = scope;
    const { flowid, runid, stepid, jobid } = scope;

    super({ traceId, spanId, traceParent }, { source });

    this.otel = { traceId, spanId, traceParent };
    this.#jobScope = { flowid, runid, stepid, jobid };
    this.jobOtelAttributesMap = jobOtelAttributesMap;
    this.bus = bus;
  }

  async emit<T extends JobEventType>(
    type: T,
    data: JobEventData<T>
  ): Promise<void> {
    const event = {
      ...this.envelopeHeader(),
      ...this.#jobScope,
      data,
      type,
      domain: this.jobOtelAttributesMap[type].domain,
      action: this.jobOtelAttributesMap[type].action,
      ...(this.jobOtelAttributesMap[type].entity
        ? { entity: this.jobOtelAttributesMap[type].entity }
        : {}),
    } satisfies JobEvent<T>;

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
