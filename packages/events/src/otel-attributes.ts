import {
  StepOtelAttributesMap,
  FlowOtelAttributesMap,
  EngineOtelAttributesMap,
  RunOtelAttributesMap,
  JobOtelAttributesMap,
  ToolOtelAttributesMap,
  WorkerOtelAttributesMap,
  SystemOtelAttributesMap,
} from "@lcase/types";

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
  "job.httpjson.requested": {
    action: "requested",
    domain: "job",
    entity: "httpjson",
  },
  "job.queued": {
    action: "queued",
    domain: "job",
    entity: undefined,
  },
} satisfies JobOtelAttributesMap;

export const toolOtelAttributesMap = {
  "tool.completed": {
    action: "completed",
    domain: "tool",
    entity: undefined,
  },
  "tool.started": {
    action: "started",
    domain: "tool",
    entity: undefined,
  },
  "tool.failed": {
    action: "failed",
    domain: "tool",
    entity: undefined,
  },
} satisfies ToolOtelAttributesMap;

export const workerOtelAttributesMap = {
  "worker.stopped": {
    action: "stopped",
    domain: "worker",
    entity: undefined,
  },
  "worker.started": {
    action: "started",
    domain: "worker",
    entity: undefined,
  },
  "worker.registered": {
    action: "registered",
    domain: "worker",
    entity: undefined,
  },
  "worker.registration.requested": {
    action: "requested",
    domain: "worker",
    entity: "registration",
  },
} satisfies WorkerOtelAttributesMap;

export const systemOtelAttributesMap = {
  "system.logged": {
    action: "logged",
    domain: "system",
    entity: undefined,
  },
} satisfies SystemOtelAttributesMap;
