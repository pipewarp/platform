import {
  QueuePort,
  EventBusPort,
  EventEnvelope,
  StepCompletedEvent,
  StreamRegistryPort,
  InputChunk,
} from "@pipewarp/ports";
import { McpManager } from "../step-executor/mcp.manager.js";
import { randomUUID } from "crypto";
import { LoggingMessageNotificationSchema } from "@modelcontextprotocol/sdk/types.js";
import { isSetIterator } from "util/types";

export class McpWorker {
  #waiters = new Map<string, boolean>();
  constructor(
    private readonly queues: QueuePort,
    private readonly bus: EventBusPort,
    private readonly mcps: McpManager,
    private readonly streamManager: StreamRegistryPort
  ) {}

  async handleActionMcp(e: EventEnvelope) {
    console.log("[worker] handleEvent() event:", e);
    if (e.kind === "step.queued" && e.data.stepType === "action") {
      const mcpDb = this.mcps.get(e.data.tool);
      if (!mcpDb) {
        const log = `[engine] executeStep(): no mcp for ${e.data.tool}`;
        console.log(log);
        return;
      }
      const mcpClient = mcpDb.client;

      if (e.data.pipe?.to) {
        let newArt = "";
        const producer = this.streamManager.getProducer(e.data.pipe.to);
        mcpClient.setNotificationHandler(
          LoggingMessageNotificationSchema,
          (d) => {
            const chunk: InputChunk = {
              type: "data",
              payload: {
                text: d,
              },
            };
            console.log(e.data.stepName);
            newArt += d.params.message;
            console.log(newArt);
            producer.send(chunk);
          }
        );
      }

      try {
        if (e.data.pipe?.from) {
          const consumer = this.streamManager.getConsumer(e.data.pipe.from);

          const buffer = [];
          let sentArt = "";

          for await (const chunk of consumer.subscribe()) {
            const payload = chunk.payload as {
              text?: { params?: { message?: string } };
            };
            const message = payload?.text?.params?.message ?? "";
            const response = await mcpClient.callTool({
              name: e.data.op,
              arguments: {
                art: message,
                isStreaming: true,
                delayMs: 10,
              },
            });
            // sentArt += message;
            // console.log(sentArt);
            buffer.push(response.content as Array<Record<string, unknown>>);
          }
          const stepCompletedEvent: StepCompletedEvent = {
            correlationId: e.correlationId,
            id: randomUUID(),
            time: new Date().toISOString(),
            kind: "step.completed",
            runId: e.runId,
            data: {
              stepName: e.data.stepName,
              ok: true,
              result: buffer,
            },
          };

          await this.bus.publish("steps.lifecycle", stepCompletedEvent);
        } else {
          const response = await mcpClient.callTool({
            name: e.data.op,
            arguments: e.data.args,
          });
          console.log(
            `[worker] handleActionMcp callTool() response:`,
            response
          );

          const stepCompletedEvent: StepCompletedEvent = {
            correlationId: e.correlationId,
            id: randomUUID(),
            time: new Date().toISOString(),
            kind: "step.completed",
            runId: e.runId,
            data: {
              stepName: e.data.stepName,
              ok: response.isError ? false : true,
              result: response.isError
                ? undefined
                : (response.content as Array<Record<string, unknown>>),
            },
          };

          await this.bus.publish("steps.lifecycle", stepCompletedEvent);
        }
        // not step completed of streaming.
      } catch (err) {
        const error = err as Error;
        console.error(error.message);
        const stepCompletedEvent: StepCompletedEvent = {
          correlationId: e.correlationId,
          id: randomUUID(),
          time: new Date().toISOString(),
          kind: "step.completed",
          runId: e.runId,
          data: {
            stepName: e.data.stepName,
            ok: false,
            result: undefined,
            error: error.message,
          },
        };
        await this.bus.publish("steps.lifecycle", stepCompletedEvent);
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
