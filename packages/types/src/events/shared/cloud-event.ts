import type { EventMap, EventType } from "../event-map.js";

/**
 * base cloud event envelope used for pipewarp events.
 * this is extended by a pipewarp context for some otel attributes
 *
 * data is related to type
 *
 * event system is generic union off of a strict event map which binds
 * event type to a data and a few attributes for otel
 *
 *
 * optional scoped fields are required depending on the scope of different
 * types of steps.  see their respective scopes
 *
 * @see `docs/observability.md` for details about event types and otel
 */
export interface CloudEvent<T extends EventType> {
  id: string;
  source: string; //url like pipewarp://engine/id possibly
  specversion: "1.0"; // cloud events version
  time: string;
  type: T;
  subject?: string; // secondary subject / id within the source
  datacontenttype?: string; //mime content type
  dataschema?: string; //uri of schema that the data follows
  data: EventMap[T]["data"];
  domain: EventMap[T]["domain"];
  entity?: EventMap[T]["entity"];
  action: EventMap[T]["action"];
  // otel fields
  traceparent: string; // could tighten to specific string; or use zod;
  tracestate?: string;

  // fanning out otel for easy parsing and parent span support
  traceid: string;
  spanid: string;
  parentspanid?: string;
}

export type CloudScope = {
  source: string;
  subject?: string;
  datacontenttype?: string;
  dataschema?: string;
  tracestate?: string;
};
