import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { LoggingMessageNotificationSchema } from "@modelcontextprotocol/sdk/types.js";

const client = new Client({ name: "ascii-client", version: "0.1.0" });
const transport = new SSEClientTransport(new URL("http://localhost:3004/sse"));
console.log("[ascii-client] running");
await client.connect(transport);

let art = "";

client.setNotificationHandler(LoggingMessageNotificationSchema, (n) => {
  console.log("[ascii-client] log message arg:", n);
  console.log(n.params.message);
  console.log(`[ascii-client] [${n.params.level}] ${n.params.message}`);
  art += n.params.message;
  console.log(art);
});

const result = await client.callTool({
  name: "draw",
  arguments: { delayMs: 25 },
});
console.log("[ascii-client] draw tool result:", result.structuredContent);
