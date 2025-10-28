import type { FlowEventType } from "./event-map.js";
import type { PipewarpContext } from "./pipewarp-context.js";
export type FlowContext = {
  flowId: string;
};

export type PipewarpFlowContext<T extends FlowEventType> = Omit<
  PipewarpContext<T>,
  keyof FlowContext
> &
  FlowContext;

export type FlowEvent<T extends FlowEventType> = PipewarpFlowContext<T>;
