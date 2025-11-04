import { ConsumerStreamPort, ProducerStreamPort } from "./stream.port.js";

export type ToolContext = {
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
  invoke(input: unknown, context: ToolContext): Promise<any>;
}
