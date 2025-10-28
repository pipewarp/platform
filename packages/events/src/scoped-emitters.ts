import type { EventBusPort } from "@pipewarp/ports";
import { registry } from "./event-registry.js";
import {
  StepEvent,
  StepType,
  EventData,
  StepEventType,
  StepTypeFor,
} from "@pipewarp/types";

// fields necesarry to create a step event using the step emitter
export type StepScope = {
  source: string;
  correlationId: string;
  flowId: string;
  runId: string;
  stepId: string;
  stepType: StepType;
};

/**
 * A step emitter class for publishing step events to a bus.  
 * Use this to create emitters, then pass them of to other pieces who just want
 * to publish event data easily.
 * 
 * @param type StepEventType
 * @param bus EventBusPort
 * @param scope StepScope
 * @example
 * ```typescript
 * const stepEmitter = new StepEmitter("step.event.name", bus, StepScope);
 *
 * // publish data on a bus to a premapped topic, data typed to event type
 * await stepEmitter.emit(data: {})
 * 
 * // scope object looks like this:
 * type StepScope = {
     source: string;
     correlationId: string;
     flowId: string;
     runId: string;
     stepId: string;
     stepType: StepType;
   }
 * ```
 * 
 */
export class StepEmitter<T extends StepEventType> {
  constructor(
    private readonly type: T,
    private readonly bus: EventBusPort,
    private readonly scope: StepScope
  ) {}
  async emit(data: EventData<T>) {
    const entry = registry[this.type];
    const stepType = this.scope.stepType as StepTypeFor<T>;
    const event: StepEvent<T> = {
      id: String(crypto.randomUUID()),
      specversion: "1.0",
      time: new Date().toISOString(),
      type: this.type,
      data,
      ...this.scope,
      stepType,
    } satisfies StepEvent<T>;

    const result = entry.schema.event.safeParse(data);
    if (result.error) {
      throw new Error(
        `[step-emitter] error parsing event; ${this.type}; ${result.error}`
      );
    }
    await this.bus.publish(entry.topic, event);
  }
}
