import type { EventBusPort } from "@pipewarp/ports";
import { registry } from "./event-registry.js";
import { EventEnvelopeFor, EventKindDataMap, EventKind } from "@pipewarp/types";

type EnvelopeScope<E extends EventKind> = Omit<
  EventEnvelopeFor<E>,
  "id" | "time" | "kind" | "data"
>;

type Emitter<E extends EventKind> = (data: EventKindDataMap[E]) => void;

/**
 * Creates an emitter helped function, scoped to a specific
 * event type(kind), with the necessary header envelope fields
 * for that type.
 *
 * @example
 * ```
 * // step scoped or higher emitters
 * const scoped = new ScopedEmitter(eventBus, {flowId, runId, stepId});
 *
 * const emitStepQueued = scoped.create("step.queued");
 *
 * // event is formed and published to default topic
 * emitStepQueued(data: StepQueuedEventData);
 * ```
 */
export class ScopedEmitter {
  constructor(
    private readonly bus: EventBusPort,
    private readonly scope: EnvelopeScope<EventKind>
  ) {}

  create<E extends EventKind>(kind: E): Emitter<E> {
    const entry = registry[kind];
    return (data) => {
      const envelope = {
        id: crypto.randomUUID(),
        time: new Date().toISOString(),
        kind,
        ...this.scope,
        data,
      } as EventEnvelopeFor<E>;

      const validation = entry.schema.safeParse(envelope);
      if (!validation.success) {
        throw new Error(
          `[scoped-emitter] invalid payload for ${kind}: ${validation.error.toString()}`
        );
      }

      this.bus.publish(entry.topic, envelope);
    };
  }
}
