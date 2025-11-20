// stub for console.log output for observability

import type { EventSink } from "@lcase/ports";
import { AnyEvent } from "@lcase/types";

export class ConsoleSink implements EventSink {
  readonly id = "console-log-sink";
  #enableSink = false;
  #s = "\x1b[0m";
  #c = {
    red: "\x1b[38;2;255;100;50m",
    job: "\x1b[38;2;230;224;64m",
    worker: "\x1b[38;2;252;131;226m",
    step: "\x1b[38;2;218;131;252m",
    engine: "\x1b[38;2;157;131;252m",
    tool: "\x1b[38;2;64;230;130m",
    flow: "\x1b[38;2;255;106;146m",
    run: "\x1b[38;2;235;172;106m",
    system: "\x1b[38;2;170;170;190m",
  };

  async start(): Promise<void> {
    this.#enableSink = true;
  }
  async stop(): Promise<void> {
    this.#enableSink = false;
  }
  handle(event: AnyEvent): void {
    if (!this.#enableSink) return;
    const r = this.#c.red;
    const j = this.#c.job;

    let ok = "\x1b[38;2;108;235;106m[✔]\x1b[0m";
    if (event.action !== "completed") ok = "";

    let log = "";
    if (event.type === "system.logged") {
      const l = event as AnyEvent<"system.logged">;
      log = l.data.log;
    }

    console.log(
      `${this.#c[event.domain]}[${event.type}]${this.#s}${ok} ${log}`
    );
  }
}
