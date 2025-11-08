import {
  StepOtelAttributesMap,
  FlowOtelAttributesMap,
  EngineOtelAttributesMap,
} from "@pipewarp/types";

export const stepOtelAttributes = {
  "step.action.completed": {
    domain: "step" as const,
    entity: "action" as const,
    action: "completed" as const,
  },
  "step.action.queued": {
    domain: "step" as const,
    entity: "action" as const,
    action: "queued" as const,
  },
  "step.mcp.queued": {
    action: "queued" as const,
    domain: "step" as const,
    entity: "mcp" as const,
  },
  "step.started": {
    action: "started" as const,
    domain: "step" as const,
    entity: undefined,
  },
} satisfies StepOtelAttributesMap;

export const flowOtelAttributes = {
  "flow.queued": {
    action: "queued",
    domain: "flow",
    entity: undefined,
  },
  "flow.started": {
    action: "started",
    domain: "flow",
    entity: undefined,
  },
  "flow.completed": {
    action: "completed",
    domain: "flow",
    entity: undefined,
  },
} satisfies FlowOtelAttributesMap;

export const engineOtelAttributesMap = {
  "engine.started": {
    action: "started",
    domain: "engine",
    entity: undefined,
  },
  "engine.stopped": {
    action: "stopped",
    domain: "engine",
    entity: undefined,
  },
} satisfies EngineOtelAttributesMap;
