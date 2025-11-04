import { CloudEvent } from "./cloud-event.js";
import type { FlowEventType } from "./event-map.js";
import type { PipewarpContext } from "./pipewarp-context.js";
export type FlowContext = {
  flowId: string;
};

export type PipewarpFlowContext<T extends FlowEventType> = Omit<
  PipewarpContext,
  keyof FlowContext
> &
  FlowContext;

export type FlowEvent<T extends FlowEventType> = PipewarpFlowContext<T> &
  CloudEvent<T>;
