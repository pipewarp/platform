import type { EventType, FlowEventType, StepEventType } from "./event-map.js";
import type { CloudEvent } from "./cloud-event.js";
import type { PipewarpContext } from "./pipewarp-context.js";
import type { StepContext } from "./step-event.js";
import { PipewarpFlowContext } from "./flow-event.js";

// export type ContextFor<T extends EventType> = T extends `step.${string}`
//   ? Omit<PipewarpContext, keyof StepContext<string>> & StepContext<string>
//   : PipewarpContext;

export type ContextFor<T extends EventType> = T extends StepEventType
  ? StepContext<T>
  : T extends FlowEventType
  ? PipewarpFlowContext<T>
  : PipewarpContext<T>;

// export type AnyEvent<T extends EventType = EventType> = CloudEvent<
//   T,
//   EventMap[T]
// > &
//   PipewarpContext;

export type AnyEvent<T extends EventType = EventType> = CloudEvent<T> &
  ContextFor<T>;

// export type AnyEventUnion = {
//   [T in EventType]: CloudEvent<T, EventMap[T]> & PipewarpContext;
// }[EventType];

export type AnyEventUnion = {
  [T in EventType]: CloudEvent<T> & ContextFor<T>;
}[EventType];
