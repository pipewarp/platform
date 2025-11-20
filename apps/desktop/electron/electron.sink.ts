import { EventSink } from "@lcase/ports";
import { AnyEvent } from "@lcase/types";
import { BrowserWindow } from "electron";

export class ElectronSink implements EventSink {
  id: string;
  #enableSink = false;
  constructor(id: string, private readonly win: BrowserWindow) {
    this.id = id;
  }
  async start(): Promise<void> {
    this.#enableSink = true;
  }
  async stop(): Promise<void> {
    this.#enableSink = false;
  }
  handle(event: AnyEvent): Promise<void> | void {
    if (!this.#enableSink) return;
    if (this.win.isDestroyed()) return;
    if (!this.win.webContents || this.win.webContents.isDestroyed()) return;

    this.win.webContents.send("observability:event", event);
  }
}
