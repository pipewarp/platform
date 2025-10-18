import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { LoggingMessageNotificationSchema } from "@modelcontextprotocol/sdk/types.js";

const client = new Client({ name: "ascii-client", version: "0.1.0-alpha.1" });
const transport = new SSEClientTransport(new URL("http://localhost:3005/sse"));
console.log("[transform-client] running");
await client.connect(transport);

let art = "";

const inputArt = [
  "⬜",
  "⬜",
  "⬜",
  "🟥",
  "🟥",
  "🟥",
  "🟥",
  "🟥",
  "⬜",
  "⬜",
  "⬜",
  "⬜",
  "\n",
  "⬜",
  "⬜",
  "🟥",
  "🟥",
  "🟥",
  "🟥",
  "🟥",
  "🟥",
  "🟥",
  "🟥",
  "🟥",
  "⬜",
  "\n",
  "⬜",
  "⬜",
  "🟫",
  "🟫",
  "🟫",
  "🟧",
  "🟧",
  "⬛️",
  "🟧",
  "⬜",
  "⬜",
  "⬜",
];

client.setNotificationHandler(LoggingMessageNotificationSchema, (n) => {
  console.log("[transform-client] log message arg:", n);
  art += n.params.message;
  console.log(art);
});

const result = await client.callTool({
  name: "transform",
  arguments: { delayMs: 2000, inputArt },
});
console.log("[transform-client] draw tool result:", result.structuredContent);
