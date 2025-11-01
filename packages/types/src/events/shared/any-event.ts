import type { EventType, FlowEventType, StepEventType } from "./event-map.js";
import type { CloudEvent } from "./cloud-event.js";
import type { PipewarpContext } from "./pipewarp-context.js";
import type { StepContext } from "./step-event.js";
import { PipewarpFlowContext } from "./flow-event.js";

/**
 * The varying base fields that are required for each event type.
 */
export type ContextFor<T extends EventType> = T extends StepEventType
  ? StepContext<T>
  : T extends FlowEventType
  ? PipewarpFlowContext<T>
  : PipewarpContext;
/**
 * Access any event by event type.
 * @example
 * const event: AnyEvent<"step.action.queued"> = {}
 */
export type AnyEvent<T extends EventType = EventType> = CloudEvent<T> &
  ContextFor<T>;

const am: ContextFor<"worker.registration.requested"> = {};

const a: ContextFor<"step.action.queued"> = {
  flowId: "",
  runId: "",
  stepId: "",
  stepType: "action",
};

const b: ContextFor<"step.mcp.queued"> = {
  flowId: "",
  runId: "",
  stepId: "",
  stepType: "mcp",
};

/**
 * union lookup of event by type, currently unused in the system
 */
export type AnyEventUnion = {
  [T in EventType]: CloudEvent<T> & ContextFor<T>;
}[EventType];
