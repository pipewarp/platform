import type {
  ProducerStreamPort,
  ToolContext,
  ToolPort,
  InputChunk,
  ConsumerStreamPort,
} from "@lcase/ports";
import type { JobMcpQueuedData } from "@lcase/types";
import { Client } from "@modelcontextprotocol/sdk/client";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { LoggingMessageNotificationSchema } from "@modelcontextprotocol/sdk/types.js";

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
};

type McpToolContext = {
  isProducing: boolean;
  isConsuming: boolean;
  isCleanupRunning: boolean;
  notificationHandlers: Set<string>;
};

export class McpTool implements ToolPort {
  id = "mcp-sse-tool";
  name = "Internal MCP SSE Tool";
  version = "0.1.0-alpha.4";
  #context: McpToolContext = {
    isProducing: false,
    isConsuming: false,
    isCleanupRunning: false,
    notificationHandlers: new Set(),
  };
  #client: Client;
  constructor() {
    this.#client = new Client({ name: "mcp-tool", version: "0.1.0-alpha.4" });
    this.#addShutdownHooks();
  }
  async invoke(input: unknown, context: ToolContext): Promise<unknown> {
    console.log(`[tool-mcp] ${input}`);
    const data = input as JobMcpQueuedData;
    await this.connect(data.url);

    // NOTE: currently does not support duplex streaming
    if (context.producer && !context.consumer) {
      console.log("[tool-mcp] producer streaming");
      const [producerResult, toolResult] = await Promise.all([
        this.#produceStream(context.producer, data.pipe.to?.payload),
        this.#client.callTool({
          name: data.feature.name,
          ...(data.args ? { arguments: data.args } : {}),
        }),
      ]);

      if (toolResult.isError) {
        console.log(
          `[tool-mcp] result has error:${JSON.stringify(toolResult, null, 2)}`
        );
        await this.disconnect();
        return;
      }
      await this.disconnect();
      return toolResult;
    } else if (context.consumer && !context.producer) {
      console.log("[tool-mcp] consumer streaming");
      const consumerResult = await this.#consumeStream(
        context.consumer,
        data.feature.name,
        data.args,
        data.pipe.from?.buffer
      );
      await this.disconnect();
      return consumerResult;
    } else {
      console.log("[tool-mcp] not streaming");
      const result = await this.#client.callTool({
        name: data.feature.name,
        ...(data.args ? { arguments: data.args } : {}),
      });
      if (result.isError) {
        console.log(
          `[tool-mcp] result has error:${JSON.stringify(result, null, 2)}`
        );
        await this.disconnect();
        return;
      }
      await this.disconnect();
      return result;
    }
  }

  async connect(url: string): Promise<void> {
    const transport = new SSEClientTransport(new URL(url));
    await this.#client.connect(transport);
  }

  async disconnect(): Promise<void> {
    this.removeNotifications();
    await this.#client.close();
    console.log("[mcp-tool] disconnected");
  }
  removeNotifications(): void {
    if (this.#context.notificationHandlers.size > 0) {
      for (const handler in this.#context.notificationHandlers) {
        this.#client.removeNotificationHandler(handler);
      }
    }
  }

  #pluck(path: string): (payload: unknown) => any {
    const parts = path.split(".");
    return (payload: unknown) =>
      parts.reduce((acc: any, key) => acc?.[key], payload as any);
  }

  async #produceStream(
    producer: ProducerStreamPort,
    payloadPath?: string
  ): Promise<string> {
    const deferred = this.#deferred<string>();
    const pluck = payloadPath ? this.#pluck(payloadPath) : undefined;

    let dataBuffer = "";
    this.#client.setNotificationHandler(
      LoggingMessageNotificationSchema,
      async (streamData) => {
        const data = pluck ? pluck(streamData) : streamData;
        if (data === "END") {
          this.#context.isProducing = false;

          this.#client.removeNotificationHandler("notifications/message");
          this.#context.notificationHandlers.delete("notifications/message");
          await producer.end();
          return deferred.resolve(dataBuffer);
        }

        const chunk: InputChunk = {
          type: "data",
          payload: data,
        };
        dataBuffer += data;
        console.log(dataBuffer);

        await producer.send(chunk);
      }
    );
    this.#context.notificationHandlers.add("notifications/message");

    return deferred.promise;
  }

  async #consumeStream(
    consumer: ConsumerStreamPort,
    tool: string,
    args?: Record<string, unknown>,
    buffer?: number
  ): Promise<Array<Record<string, unknown>>> {
    let chunksBuffered = 0;
    let chunkBuffer = "";

    const outBuffer: Record<string, unknown>[] = [];
    for await (const chunk of consumer.subscribe()) {
      let message = chunk.payload as string;
      if (buffer) {
        chunkBuffer += message;
        chunksBuffered++;

        if (chunksBuffered >= buffer) {
          message = chunkBuffer;
          chunksBuffered = 0;
          chunkBuffer = "";
        } else {
          continue;
        }
      }

      console.log("[tool-mcp] message being sent to transform tool:", message);
      const resolvedArgs = args
        ? this.#resolvePipeConsumerArgs<string>(args, message)
        : undefined;

      console.log("resolved args from pipe", resolvedArgs);
      const response = await this.#client.callTool({
        name: tool,
        arguments: resolvedArgs,
      });
      outBuffer.push(response.content as Record<string, unknown>);
    }
    console.log(
      `[tool-mcp] final outBuffer: ${JSON.stringify(outBuffer, null, 2)}`
    );
    return outBuffer;
  }

  #resolvePipeConsumerArgs<T>(
    args: Record<string, unknown>,
    chunk: T
  ): Record<string, unknown> {
    const newArgs: Record<string, unknown> = {}; // not mutating original args
    for (const [k, v] of Object.entries(args)) {
      if (typeof v === "string" && v === "$.pipe") {
        newArgs[k] = chunk;
      } else newArgs[k] = v;
    }
    return newArgs;
  }

  #deferred<T>(): Deferred<T> {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;

    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    return { promise, resolve, reject };
  }

  #addShutdownHooks(): void {
    const run = (signal?: NodeJS.Signals) => {
      if (this.#context.isCleanupRunning) return;
      this.#context.isCleanupRunning = true;
      void this.#cleanup(signal);
    };

    process.once("SIGINT", () => run("SIGINT"));
    process.once("SIGTERM", () => run("SIGTERM"));
    process.once("beforeExit", () => run());
  }

  async #cleanup(signal?: NodeJS.Signals): Promise<void> {
    try {
      await this.disconnect();
    } catch (err) {
      console.error("[tool-mcp] failed to disconnect during shutdown", err);
    }
  }
}
