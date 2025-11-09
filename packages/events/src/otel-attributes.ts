import {
  StepOtelAttributesMap,
  FlowOtelAttributesMap,
  EngineOtelAttributesMap,
  RunOtelAttributesMap,
  JobOtelAttributesMap,
} from "@pipewarp/types";

export const stepOtelAttributes = {
  "step.started": {
    action: "started",
    domain: "step",
    entity: undefined,
  },
  "step.completed": {
    action: "completed",
    domain: "step",
    entity: undefined,
  },
  "step.failed": {
    action: "failed",
    domain: "step",
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

export const runOtelAttributesMap = {
  "run.completed": {
    action: "completed",
    domain: "run",
    entity: undefined,
  },
  "run.started": {
    action: "started",
    domain: "run",
    entity: undefined,
  },
} satisfies RunOtelAttributesMap;

export const jobOtelAttributesMap = {
  "job.mcp.queued": {
    action: "queued",
    domain: "job",
    entity: "mcp",
  },
  "job.completed": {
    action: "completed",
    domain: "job",
    entity: undefined,
  },
  "job.started": {
    action: "started",
    domain: "job",
    entity: undefined,
  },
  "job.failed": {
    action: "failed",
    domain: "job",
    entity: undefined,
  },
} satisfies JobOtelAttributesMap;
