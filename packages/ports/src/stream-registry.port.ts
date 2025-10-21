import { StreamState } from "http2";
import {
  ConsumerStreamPort,
  ProducerStreamPort,
  StreamStatus,
} from "./stream.port.js";

export interface StreamHandles {
  id: string;
  producer: ProducerStreamPort;
  consumer: ConsumerStreamPort;
}

export interface StreamRegistryPort {
  // returns consumers and producer handles for that same stream id
  createStream(streamId: string): StreamHandles;
  getProducer(streamId: string): ProducerStreamPort;
  getConsumer(streamId: string): ConsumerStreamPort;

  closeStream(streamId: string): Promise<void>;
}
