// using async iterables to provide platform agnostic language support for
// some built in backpressure.

// types later defined in zod for schema validation depending on speed parsing

export type InputChunk<T = unknown> = {
  type: "data" | "meta" | "end" | "error";
  payload?: T;
  meta?: Record<string, unknown>;
};

export type Chunk<T = unknown> = InputChunk<T> & {
  seq: number;
  ts: number; // epoch ms
};
export type StreamStatus =
  | "idle"
  | "open"
  | "active"
  | "ended"
  | "closed"
  | "error";

export interface StreamPort {
  // close the connection to a stream, lets either side close
  close(): Promise<void>;
  // status of the stream

  // producer signals end to incoming stream

  // lifecycle: idle -> open -> active -> ended -> closed|error
  // ended marks producer is done but consumer can still pull
  status(): StreamStatus;
  // return stream id
  id(): string;
}

// current design expects one consumer per producer.
export interface ConsumerStreamPort extends StreamPort {
  // called once to receive an AsynIterable object which returns a chunk
  subscribe(): AsyncIterable<Chunk>;
}
export interface ProducerStreamPort extends StreamPort {
  send(data: InputChunk): Promise<void>;
  end(): void;
}
