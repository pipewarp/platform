import type { EventBusPort } from "@pipewarp/ports";
import { registry } from "./event-registry.js";
import {
  StepEvent,
  StepEventType,
  StepTypeFor,
  StepEventData,
} from "@pipewarp/types";

// fields necesarry to create a step event using the step emitter
export type StepScope<T extends StepEventType> = {
  source: string;
  correlationId: string;
  flowId: string;
  runId: string;
  stepId: string;
  stepType: StepTypeFor<T>;
};

// base scoped fields, only a few required.
// these relate to different event envelopes requiring different header fields
export type BaseScope = {
  source: string;
  correlationId: string;
  flowId?: string;
  runId?: string;
  stepId?: string;
  jobId?: string;
  toolId?: string;
};

export interface StepEmitter {
  emit: <T extends StepEventType>(
    type: T,
    stepType: StepTypeFor<T>,
    data: StepEventData<T>
  ) => Promise<void>;
}

/**
 * Create emitter objects based upon a common scope.
 *
 * Set scope in init(scope)
 *
 * Create emitter objects with respective emitter function.
 *
 * @param bus EventBusPort
 *
 * @member setScope(scope: BaseScope): void
 * @member newStepEmitter(): StepEmitter
 *
 * @example
 * ```
 * const emitterFactory = new EmitterFactory();
 * emitterFactory.setScope({...}: BaseScope)
 * const stepEmitter = newStepEmitter(type, stepType, data);
 * await stepEmitter.emit(data);
 *
 */

export class EmitterFactory {
  #stepScope = new Set(["flowId", "runId", "stepId"]);
  #flowScope = new Set(["flowId"]);
  #hasStepScope = false;
  #hasFlowScope = false; // newFlowEmitter() not yet implemented
  private scope?: BaseScope;
  constructor(private readonly bus: EventBusPort) {}

  // can reset scope mutiple times; doesnt affect previously created emitters
  setScope(scope: BaseScope): void {
    this.scope = scope;

    // looping once but counting unique fields to determine available scopes
    let stepCount = 0;
    let flowCount = 0;
    for (const key in scope) {
      if (this.#stepScope.has(key)) stepCount++;
      if (this.#flowScope.has(key)) flowCount++;
    }
    this.#hasStepScope = this.#stepScope.size === stepCount ? true : false;
    this.#hasFlowScope = this.#flowScope.size === flowCount ? true : false;
  }

  newStepEmitter(): StepEmitter {
    if (!this.#hasStepScope) {
      throw new Error("[emitter-factory] wrong scope for step");
    }

    return {
      emit: async <T extends StepEventType>(
        type: T,
        stepType: StepTypeFor<T>,
        data: StepEventData<T>
      ): Promise<void> => {
        const event = {
          id: String(crypto.randomUUID()),
          specversion: "1.0",
          time: new Date().toISOString(),
          type,
          data,
          ...(this.scope as StepScope<T>),
          stepType,
        } satisfies StepEvent<T>;

        console.log("event", JSON.stringify(event, null, 2));
        const entry = registry[type];
        const result = entry.schema.event.safeParse(event);
        if (result.error) {
          throw new Error(
            `[step-emitter] error parsing event; ${type}; ${result.error}`
          );
        }
        await this.bus.publish(entry.topic, event);
      },
    };
  }
}
