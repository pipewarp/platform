/*-- step events -------------------- */
export type StepEventContext = {
  flowId: string;
  runId: string;
  stepId: string;
};

export type StepEventScope = StepEventContext & {
  scope: "step";
  kind: StepEventKind;
};

export type ActionQueuedEventData = {
  stepType: "action";
  stepName: string;
  tool: string;
  op: string;
  profile?: string;
  args?: Record<string, unknown>;
  pipe: {
    to?: {
      id: string;
      payload: string;
    };
    from?: {
      id: string;
      buffer?: number;
    };
  };
};
export type WaitQueuedEventData = {
  stepType: "wait";
  stepName: string;
  duration: number;
};
export type StepQueuedEventData = ActionQueuedEventData | WaitQueuedEventData;

export type StepQueuedEvent = StepEventContext & {
  kind: "step.queued";
  data: StepQueuedEventData;
};

export type StepCompletedEvent = StepEventContext & {
  kind: "step.completed";
  data: {
    stepName: string;
    ok: boolean;
    result?: unknown;
    error?: string;
  };
};

export type StepEvent = (StepCompletedEvent | StepQueuedEvent) &
  StepEventContext;
export type StepEventKind = StepEvent["kind"];

// these need replacing.
export type StepQueuedEventEnvelope = StepQueuedEvent & EventEnvelopeBase;
export type StepCompletedEventEnvelope = StepCompletedEvent & EventEnvelopeBase;

/*-- flow events -------------------- */
export type FlowEventContext = {
  flowId: string;
};

export type FlowEventScope = FlowEventContext & {
  scope: "flow";
  kind: FlowEventKind;
};
export type FlowQueuedEvent = FlowEventContext & {
  kind: "flow.queued";
  data: {
    flowName: string;
    inputs: Record<string, unknown>;
    test?: boolean;
    outfile: string;
  };
};

export type FlowEvent = FlowQueuedEvent;
export type FlowEventKind = FlowEvent["kind"];
export type FlowQueuedEventEnvelope = FlowQueuedEvent & EventEnvelopeBase;

export interface EventEnvelopeBase {
  id: string;
  correlationId: string;
  time: string;
}

export type StepEventEnvelope =
  | StepQueuedEventEnvelope
  | StepCompletedEventEnvelope;
export type FlowEventEnvelope = FlowQueuedEventEnvelope;

export type EventEnvelope = StepEventEnvelope | FlowEventEnvelope;
// export type EventEnvelope = StepEventEnvelope;

export type EventKind = EventEnvelope["kind"];
export type EventData = EventEnvelope["data"];
export type EventKindDataMap = {
  [K in EventKind]: Extract<EventEnvelope, { kind: K }>["data"];
};

export type EventEnvelopeFor<K extends EventKind> = Extract<
  EventEnvelope,
  { kind: K }
>;

export type StepEventKindDataMap = {
  [K in StepEventKind]: Extract<StepEventEnvelope, { kind: K }>["data"];
};
export type StepEventEnvelopeFor<K extends StepEventKind> = Extract<
  StepEventEnvelope,
  { kind: K }
>;

export type CombinedScope = FlowEventScope | StepEventScope;
export type Scope = CombinedScope["scope"];
// export type ScopeFor<S extends Scope> = Extract<CombinedScope, { scope: S }>;

export type ScopeFor<S extends Scope> = Omit<
  Extract<CombinedScope, { scope: S }>,
  "scope" | "kind"
>;

export type ScopeEventKindFor<S extends Scope> = Extract<
  CombinedScope,
  { scope: S }
>["kind"];
