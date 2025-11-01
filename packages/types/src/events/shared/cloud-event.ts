import type { EventMap, EventType } from "./event-map.js";
// export interface CloudMetaEvent<T keyof string> {
//   id: string;
//   source: string; // url reference "/services/step-runner" "urn:pipewarp:flow/123"
//   specversion: "1.0"; // cloud events version
//   correlationId: string;
//   time: string;
//   type: T;
//   subject?: string; // secondary subject / id within the source
//   datacontenttype?: string; //mime content type
//   dataschema?: string; //uri of schema that the data follows
//   // data?: D; // optional event payyload
// }

export interface CloudEvent<T extends EventType> {
  id: string;
  source: string; // url reference "/services/step-runner" "urn:pipewarp:flow/123"
  specversion: "1.0"; // cloud events version
  correlationId: string;
  time: string;
  type: T;
  subject?: string; // secondary subject / id within the source
  datacontenttype?: string; //mime content type
  dataschema?: string; //uri of schema that the data follows
  data: EventMap[T];
}
// export type CloudEvent<T extends string> = CloudMetaEvent<T> &
//   CloudDataEvent<T>;
