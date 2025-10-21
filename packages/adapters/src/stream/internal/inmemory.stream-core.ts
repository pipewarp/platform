import type {
  ConsumerStreamPort,
  ProducerStreamPort,
  Chunk,
  InputChunk,
  StreamStatus,
} from "@pipewarp/ports";

// NOTE: not exported to public (internal package)
// NOTE: we use a core here to then create ConsumerStream and ProducerStream
// views, because consumers dont need to push, and producers dont need to
// subscribe, etc.
// But the stream needs to have one identity.
// the StreamRegistry produces these "views".
// Those views are public, thus this class is internal and named "core",
// it should not be exported to public.

type DeferredResolve<Chunk> = (v: Chunk) => void;
type DeferedReject = (e: unknown) => void;
type Deferred<Chunk> = {
  promise: Promise<Chunk>;
  resolve: DeferredResolve<Chunk>;
  reject: DeferedReject;
};
export class InMemoryStreamCore
  implements ConsumerStreamPort, ProducerStreamPort
{
  #buffer: Chunk[] = [];
  #deferreds: Deferred<Chunk>[] = [];
  #status: StreamStatus = "idle";
  #producerDone: boolean = false;
  #consumerDone: boolean = false;
  #nextSeq: number = 0;
  #asyncGenerator: AsyncGenerator<Chunk> | undefined = undefined;

  constructor(private readonly streamId: string) {}
  close(): Promise<void> {
    this.#status !== "closed" && (this.#status = "closed");
    throw new Error("Method not implemented.");
  }
  end(): void {
    this.#status !== "ended" && (this.#status = "ended");
    this.#producerDone = true;
  }
  status(): StreamStatus {
    return this.#status;
  }
  id(): string {
    return this.streamId;
  }

  // repeated calls return the same generator instance
  subscribe(): AsyncGenerator<Chunk> {
    // if already returned a generator, return the same generator
    if (this.#asyncGenerator) return this.#asyncGenerator;

    this.#status !== "open" && (this.#status = "open");

    const getNextChunk = async (): Promise<Chunk> => {
      if (this.#buffer.length > 0) {
        this.#status !== "active" && (this.#status = "active");
        return this.#buffer.shift()!;
      }
      if (this.#producerDone && this.#buffer.length === 0) {
        const chunk: Chunk = {
          seq: this.#nextSeq++,
          ts: Date.now(),
          type: "end",
        };
        return chunk;
      }
      const deferred = this.createDeferred<Chunk>();

      this.#deferreds.push(deferred);
      return deferred.promise;
    };

    async function* asyncGenerator(): AsyncGenerator<Chunk> {
      try {
        while (true) {
          const chunk = await getNextChunk();
          yield chunk;
          if (chunk.type == "end") {
            break;
          }
        }
      } catch (err) {
        console.log(err);
      }
    }

    const generator = asyncGenerator();
    this.#asyncGenerator = generator;
    return generator;
  }
  async send(data: InputChunk): Promise<void> {
    this.#status !== "active" && (this.#status = "active");

    const chunk: Chunk = {
      ...data,
      ts: Date.now(),
      seq: this.#nextSeq++,
    };

    // resolve if deferred is not empty
    if (this.#deferreds.length > 0) {
      const deferred = this.#deferreds.shift()!;
      return deferred.resolve(chunk);
    }
    this.#buffer.push(chunk);
    return;
  }

  private createDeferred<Chunk>(): Deferred<Chunk> {
    let resolve!: DeferredResolve<Chunk>;
    let reject!: DeferedReject;
    const promise = new Promise<Chunk>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    return { promise, resolve, reject };
  }
}
