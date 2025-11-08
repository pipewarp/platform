import type { EventType, FlowEventType, StepEventType } from "./event-map.js";
import type { CloudEvent } from "./shared/cloud-event.js";
import type { StepScope } from "./shared/step-event.js";
import type { FlowScope } from "./shared/flow-event.js";
import { EngineEventType } from "./engine/map.js";
import { EngineScope } from "./engine/scope.js";

/**
 * The varying base fields that are required for each event type.
 */
export type ScopeFor<T extends EventType> = T extends StepEventType
  ? StepScope
  : T extends FlowEventType
  ? FlowScope
  : T extends EngineEventType
  ? EngineScope
  : {};

/**
 * Access any event by event type.
 * @example
 * const event: AnyEvent<"step.action.queued"> = {}
 */

export type AnyEvent<T extends EventType = EventType> = CloudEvent<T> &
  ScopeFor<T>;
