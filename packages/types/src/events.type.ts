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

export type StepQueuedEvent = {
  kind: "step.queued";
  runId: string;
  data: StepQueuedEventData;
};

export type StepCompletedEvent = {
  kind: "step.completed";
  runId: string;
  data: {
    stepName: string;
    ok: boolean;
    result?: unknown;
    error?: string;
  };
};

export type StepEvent = StepCompletedEvent | StepQueuedEvent;
export type StepQueuedEventEnvelope = StepQueuedEvent & EventEnvelopeBase;
export type StepCompletedEventEnvelope = StepCompletedEvent & EventEnvelopeBase;

export type FlowQueuedEvent = {
  kind: "flow.queued";
  data: {
    flowName: string;
    inputs: Record<string, unknown>;
    test: boolean;
    outfile: string;
  };
};
export type FlowEvent = FlowQueuedEvent;
export type FlowQueuedEventEnvelope = FlowQueuedEvent & EventEnvelopeBase;

export interface EventEnvelopeBase {
  id: string;
  correlationId: string;
  time: string;
  runId?: string;
}

export type StepEventEnvelope = StepEvent & EventEnvelopeBase;
export type FlowEventEnvelope = FlowEvent & EventEnvelopeBase;

export type EventEnvelope = StepEventEnvelope | FlowEventEnvelope;
