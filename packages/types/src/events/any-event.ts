import type { EventType, FlowEventType } from "./event-map.js";
import type { CloudEvent } from "./shared/cloud-event.js";
import type { StepScope } from "./step/event.js";
import type { StepEventType } from "./step/map.js";
import type { FlowScope } from "./shared/flow-event.js";
import type { EngineEventType } from "./engine/map.js";
import type { EngineScope } from "./engine/scope.js";
import type { RunScope, RunEventType } from "./run/index.js";
import type { JobEventType } from "./job/map.js";
import type { JobScope } from "./job/event.js";
import type { ToolEventType } from "./tool/map.js";
import type { ToolScope } from "./tool/event.js";
import type { WorkerEventType } from "./worker/map.js";
import type { WorkerScope } from "./worker/event.js";

/**
 * The varying base fields that are required for each event type.
 */
export type ScopeFor<T extends EventType> = T extends StepEventType
  ? StepScope
  : T extends FlowEventType
  ? FlowScope
  : T extends EngineEventType
  ? EngineScope
  : T extends RunEventType
  ? RunScope
  : T extends JobEventType
  ? JobScope
  : T extends ToolEventType
  ? ToolScope
  : T extends WorkerEventType
  ? WorkerScope
  : {};

/**
 * Access any event by event type.
 * @example
 * const event: AnyEvent<"step.action.queued"> = {}
 */

export type AnyEvent<T extends EventType = EventType> = CloudEvent<T> &
  ScopeFor<T>;
