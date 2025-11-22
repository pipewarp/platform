import { JobEventData, JobEventType, JobRequestedType } from "@lcase/types";
import { ConsumerStreamPort, ProducerStreamPort } from "./stream.port.js";

export type ToolContext<T extends JobRequestedType> = {
  data: JobEventData<T>;
  flowId: string;
  runId: string;
  stepId: string;
  capability: string;
  workerId: string;
  consumer?: ConsumerStreamPort;
  producer?: ProducerStreamPort;
  emitter?: never; // not yet implemented tool event emitter

  auth?: Record<string, string>;
  config?: Record<string, string>;
};
export interface ToolPort {
  id: string;
  name: string;
  invoke(input: unknown, context: ToolContext<JobRequestedType>): Promise<any>;
}
