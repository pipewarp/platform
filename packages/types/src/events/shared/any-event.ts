import type { EventType, FlowEventType, StepEventType } from "./event-map.js";
import type { CloudEvent } from "./cloud-event.js";
import type { StepScope } from "./step-event.js";
import type { FlowScope } from "./flow-event.js";

/**
 * The varying base fields that are required for each event type.
 */
export type ScopeFor<T extends EventType> = T extends StepEventType
  ? StepScope
  : T extends FlowEventType
  ? FlowScope
  : {};

/**
 * Access any event by event type.
 * @example
 * const event: AnyEvent<"step.action.queued"> = {}
 */
export type AnyEvent<T extends EventType = EventType> = CloudEvent<T> &
  ScopeFor<T>;
