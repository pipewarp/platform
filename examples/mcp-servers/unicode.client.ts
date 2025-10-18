import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { LoggingMessageNotificationSchema } from "@modelcontextprotocol/sdk/types.js";

const client = new Client({ name: "unicode-client", version: "0.1.0" });
const transport = new SSEClientTransport(new URL("http://localhost:3004/sse"));
console.log("[unicode-client] running");
await client.connect(transport);

let art = "";
const stream = true;
client.setNotificationHandler(LoggingMessageNotificationSchema, (n) => {
  if (stream) {
    console.log("[unicode-client] log message arg:", n);
    console.log(n.params.message);
    console.log(`[unicode-client] [${n.params.level}] ${n.params.message}`);
    art += n.params.message;
    console.log(art);
  } else {
    console.log("[unicode-client] log message arg:", n);
  }
});

const result = await client.callTool({
  name: "draw",
  arguments: { delayMs: 25, stream },
});
console.log("[unicode-client] draw tool result:", result.structuredContent);
