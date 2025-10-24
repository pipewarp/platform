import type {
  QueuePort,
  EventBusPort,
  EventEnvelope,
  StepCompletedEvent,
  StreamRegistryPort,
  InputChunk,
  ProducerStreamPort,
  ConsumerStreamPort,
  StepQueuedEvent,
} from "@pipewarp/ports";
import { McpManager } from "../mcp-manager/mcp.manager.js";
import { randomUUID } from "crypto";
import { LoggingMessageNotificationSchema } from "@modelcontextprotocol/sdk/types.js";
import { Client } from "@modelcontextprotocol/sdk/client";

type McpContext = {
  mcpId: string;
  runId: string;
  correlationId: string;
  pipe: {
    from: {
      id?: string;
      isStreaming: boolean;
    };
    to: {
      id?: string;
      isStreaming: boolean;
      payload?: string;
    };
  };
  stepName: string;
  tool: string;
  op: string;
  args: Record<string, unknown> | undefined;
  status: string;
  ongoingStreams: number;
};

export class McpWorker {
  #waiters = new Map<string, boolean>();
  #workers = new Map<string, McpContext>();

  constructor(
    private readonly queues: QueuePort,
    private readonly bus: EventBusPort,
    private readonly mcps: McpManager,
    private readonly streamManager: StreamRegistryPort
  ) {}

  // get portion of data from the payload; defined by flow like `object.property`

  #pluck(path: string) {
    const parts = path.split(".");
    return (payload: unknown) =>
      parts.reduce((acc: any, key) => acc?.[key], payload as any);
  }
  #produceStream(
    ctx: McpContext,
    client: Client,
    paylodPath: string,
    producer: ProducerStreamPort
  ): void {
    const pluck = this.#pluck(paylodPath);
    let newArt = "";

    console.log("[worker] staring producer stream");
    client.setNotificationHandler(LoggingMessageNotificationSchema, (d) => {
      const data = pluck(d);
      if (data === "END") {
        ctx = this.#workers.get(ctx.mcpId)!;
        ctx.ongoingStreams--;
        if (ctx.ongoingStreams === 0) {
          this.#sendStepCompletedEvent(ctx, newArt);
        }
        client.removeNotificationHandler("notifications/message");
        producer.end();
        return;
      }
      const chunk: InputChunk = {
        type: "data",
        payload: data,
      };
      newArt += data;
      console.log(newArt);
      producer.send(chunk);
    });
  }

  #resolvePipeArgs<T>(ctx: McpContext, m: T): Record<string, unknown> {
    if (!ctx.pipe.from.id) {
      throw new Error("[worker] no pipe to resolve args from");
    }
    if (!ctx.args || Object.keys(ctx.args).length === 0) {
      throw new Error("[worker] no args to process");
    }

    const args: Record<string, unknown> = { ...ctx.args! };
    for (const [k, v] of Object.entries(ctx.args)) {
      if (typeof v === "string") {
        if (v === "$.pipe") {
          args[k] = m;
        }
      }
    }
    return args;
  }

  async #consumeStream(
    ctx: McpContext,
    client: Client,
    consumer: ConsumerStreamPort
  ): Promise<void> {
    const buffer = [];
    let sentArt = "";

    this.#workers.set(ctx.mcpId, ctx);
    console.log("[worker] starting consumer stream");
    for await (const chunk of consumer.subscribe()) {
      const payload = chunk.payload;
      const message = payload as string;

      const args = this.#resolvePipeArgs<string>(ctx, message);
      const response = await client.callTool({
        name: ctx.op,
        arguments: args,
      });
      sentArt += message;
      console.log(sentArt);
      buffer.push(response.content as Array<Record<string, unknown>>);
    }
    ctx = this.#workers.get(ctx.mcpId)!;
    ctx.ongoingStreams--;
    ctx.pipe.from.isStreaming = false;
    this.#workers.set(ctx.mcpId, ctx);

    if (ctx.ongoingStreams === 0) {
      console.log("[worker] no streams left", ctx.stepName);
      this.#sendStepCompletedEvent(ctx, buffer);
    }
    console.log("[worker] streams left", ctx.stepName);
  }

  async #sendStepCompletedEvent<T>(ctx: McpContext, data: T): Promise<void> {
    const stepCompletedEvent: StepCompletedEvent = {
      correlationId: "later",
      id: randomUUID(),
      time: new Date().toISOString(),
      kind: "step.completed",
      runId: ctx.runId,
      data: {
        stepName: ctx.stepName,
        ok: true,
        result: data,
      },
    };
    await this.bus.publish("steps.lifecycle", stepCompletedEvent);
  }

  #makeContext(e: StepQueuedEvent): McpContext {
    if (e.data.stepType !== "action") {
      throw new Error("[mcp-worker] step type must be 'action'");
    }
    const context: McpContext = {
      mcpId: e.data.tool,
      correlationId: e.correlationId,
      runId: e.runId,

      stepName: e.data.stepName,
      tool: e.data.tool,
      op: e.data.op,
      args: e.data.args,

      status: "started",
      pipe: {
        from: {
          id: e.data.pipe.from?.id,
          isStreaming: false,
        },
        to: {
          id: e.data.pipe.to?.id,
          isStreaming: false,
          payload: e.data.pipe.to?.payload,
        },
      },
      ongoingStreams: 0,
    };

    this.#workers.set(e.data.tool, context);
    return context;
  }

  async handleActionMcp(e: EventEnvelope) {
    console.log("[worker] handleEvent() event:", e);
    if (e.kind === "step.queued" && e.data.stepType === "action") {
      const context = this.#makeContext(e);
      this.#workers.set(e.data.tool, context);

      await this.handleActionStepQueuedEvent(context);
    } else {
      return;
    }
  }

  async handleActionStepQueuedEvent(ctx: McpContext) {
    const mcpDb = this.mcps.get(ctx.tool);
    if (!mcpDb) {
      const log = `[engine] executeStep(): no mcp for ${ctx.tool}`;
      console.log(log);
      return;
    }
    const mcpId = ctx.tool;
    const mcpClient = mcpDb.client;

    if (ctx.pipe.to.id !== undefined) {
      const producer = this.streamManager.getProducer(ctx.pipe.to.id);
      const payloadPath = ctx.pipe.to.payload ?? "";
      this.#produceStream(ctx, mcpClient, payloadPath, producer);
      ctx.pipe.to.isStreaming = true;
      ctx.ongoingStreams++;
      this.#workers.set(mcpId, ctx);
    }
    if (ctx.pipe.from.id !== undefined) {
      const consumer = this.streamManager.getConsumer(ctx.pipe.from.id);
      this.#consumeStream(ctx, mcpClient, consumer);
      ctx.pipe.from.isStreaming = true;
      ctx.ongoingStreams++;
      this.#workers.set(mcpId, ctx);
    }

    // if mcp has to and not from, call it to start streaming it
    // if mcps has from, dont call it, even if it has too.
    // too comes from the invoking of from in this context for mcp servers
    if (!ctx.pipe.from.isStreaming) {
      try {
        const response = await mcpClient.callTool({
          name: ctx.op,
          arguments: ctx.args,
        });
        console.log(`[worker] handleActionMcp callTool() response:`, response);

        if (ctx.ongoingStreams === 0) {
          await this.#sendStepCompletedEvent(ctx, response);
        }
      } catch (err) {
        const error = err as Error;
        console.error(error.message);

        if (ctx.ongoingStreams === 0) {
          await this.#sendStepCompletedEvent(ctx, error);
        }
      }
    }
  }

  async startMcp(mcpId: string): Promise<void> {
    if (!this.mcps.has(mcpId)) {
      console.log("[worker] cannot start mcp; no mcp with id:", mcpId);
      return;
    }
    if (this.#waiters.get(mcpId)) {
      console.log("[worker] already running waiter for tool: ", mcpId);
      return;
    }

    this.startWaiter(mcpId);
  }

  async stopMcp(mcpId: string): Promise<void> {
    if (!this.mcps.has(mcpId)) {
      console.log("[worker] cannot stop mcp; no mcp with id:", mcpId);
      return;
    }
    if (!this.#waiters.get(mcpId)) {
      console.log("[worker] cannot stop mcp; already stopped id: ", mcpId);
      return;
    }
    await this.stopWaiter(mcpId);
  }

  async startWaiter(mcpId: string): Promise<void> {
    this.#waiters.set(mcpId, true);
    console.log("[worker] starting waiter for mcpId:", mcpId);
    while (this.#waiters.get(mcpId)) {
      const event = await this.queues.reserve(mcpId, mcpId);
      if (event === null || event.kind === undefined) continue;
      // check undefined or whatever
      await this.handleActionMcp(event);
    }
  }
  async stopWaiter(mcpId: string): Promise<void> {
    this.#waiters.set(mcpId, false);
    // this.queues destroy or whatever
  }
}
