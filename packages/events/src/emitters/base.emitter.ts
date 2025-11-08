import { CloudScope } from "@pipewarp/types";
import { OtelContext, EnvelopeHeader } from "../types.js";

/**
 * base emitter class all other emitters inherit.
 * currently helps create base envelope fields from otel context
 * and cloud scopes
 */
export class BaseEmitter {
  protected otel: OtelContext;
  protected cloudScope: CloudScope;
  constructor(otel: OtelContext, cloudScope: CloudScope) {
    this.otel = { ...otel };
    this.cloudScope = { ...cloudScope };
  }

  protected envelopeHeader(): EnvelopeHeader {
    return {
      id: String(crypto.randomUUID()),
      time: new Date().toISOString(),
      specversion: "1.0",
      traceid: this.otel.traceId,
      spanid: this.otel.spanId,
      traceparent: this.otel.traceParent,
      ...this.cloudScope,
      ...(this.otel.parentSpanId
        ? { parentspanid: this.otel.parentSpanId }
        : {}),
    };
  }
}
