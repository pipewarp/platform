export type Chunk<T = unknown> = {
  type: "data" | "meta" | "end" | "error";
  payload: T; // utf 8 strings default
  seq: number;
  ts: number; // epoch ms
  meta?: Record<string, unknown>;
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

  // lifecycle: idle -> open -> active -> ended -> closed|error
  // ended marks producer is done but consumer can still pull
  status(): StreamStatus;
  // return stream id
  id(): string;
}

export interface ConsumerStreamPort extends StreamPort {
  // called multiple times to recieve one chunk from an async iterable
  pull(): AsyncIterable<Chunk>;
  // later support subscribe() for producers who braodcast()
}
export interface ProducerStreamPort extends StreamPort {
  send(data: Chunk): Promise<void>;
  // later support braodcast() to send to consumers who subscribe()
}
