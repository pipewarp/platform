import { EventSink } from "@pipewarp/ports";
import { AnyEvent } from "@pipewarp/types";
import { WebSocket, WebSocketServer } from "ws";

export class WebSocketServerSink implements EventSink {
  id = "websocket-sink";
  wss: WebSocketServer;
  socket: WebSocket | undefined;
  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
  }
  start(): Promise<void> {
    process.on("SIGINT", () => {
      this.wss.close();
      return;
    });

    return new Promise((resolve) => {
      this.wss.on("connection", (socket) => {
        this.socket = socket;
        this.socket.ping();
        this.socket.on("pong", (event) => {
          resolve();
        });
      });
    });
  }

  stop(): Promise<void> | void {
    throw new Error("Method not implemented.");
  }

  handle(event: AnyEvent): void {
    console.log(`[wss-sink] ${event.type}`);
    if (this.socket) {
      this.socket.send(JSON.stringify(event));
    }
  }
}
