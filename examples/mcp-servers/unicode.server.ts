import express from "express";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

const app = express();
app.use(express.json());

// map transports to specific session ids (no auth)
const sessions = new Map<string, SSEServerTransport>();
const port = 3004;
const mcp = new McpServer({
  name: "unicode-server",
  version: "0.1.0",
  capabilities: { logging: {} },
});

// 12x16 unicode art
// 🟥
// ⬜
// 🟧
// ⬛️
// 🟫
// 🟦

const artArray = [
  ["⬜", "⬜", "⬜", "🟥", "🟥", "🟥", "🟥", "🟥", "⬜", "⬜", "⬜", "⬜"],
  ["⬜", "⬜", "🟥", "🟥", "🟥", "🟥", "🟥", "🟥", "🟥", "🟥", "🟥", "⬜"],
  ["⬜", "⬜", "🟫", "🟫", "🟫", "🟧", "🟧", "⬛️", "🟧", "⬜", "⬜", "⬜"],
  ["⬜", "🟫", "🟧", "🟫", "🟧", "🟧", "🟧", "⬛️", "🟧", "🟧", "🟧", "⬜"],
  ["⬜", "🟫", "🟧", "🟫", "🟫", "🟧", "🟧", "🟧", "⬛️", "🟧", "🟧", "🟧"],
  ["⬜", "🟫", "🟫", "🟧", "🟧", "🟧", "🟧", "⬛️", "⬛️", "⬛️", "⬛️", "⬜"],
  ["⬜", "⬜", "⬜", "🟧", "🟧", "🟧", "🟧", "🟧", "🟧", "🟧", "⬜", "⬜"],
  ["⬜", "⬜", "🟥", "🟥", "🟦", "🟥", "🟥", "🟥", "🟥", "⬜", "⬜", "⬜"],
  ["⬜", "🟥", "🟥", "🟥", "🟦", "🟥", "🟥", "🟦", "🟥", "🟥", "🟥", "⬜"],
  ["🟥", "🟥", "🟥", "🟥", "🟦", "🟦", "🟦", "🟦", "🟥", "🟥", "🟥", "🟥"],
  ["🟧", "🟧", "🟥", "🟦", "🟧", "🟦", "🟦", "🟧", "🟦", "🟥", "🟧", "🟧"],
  ["🟧", "🟧", "🟧", "🟦", "🟦", "🟦", "🟦", "🟦", "🟦", "🟧", "🟧", "🟧"],
  ["🟧", "🟧", "🟦", "🟦", "🟦", "🟦", "🟦", "🟦", "🟦", "🟦", "🟧", "🟧"],
  ["⬜", "⬜", "🟦", "🟦", "🟦", "⬜", "⬜", "🟦", "🟦", "🟦", "⬜", "⬜"],
  ["⬜", "🟫", "🟫", "🟫", "⬜", "⬜", "⬜", "⬜", "🟫", "🟫", "🟫", "⬜"],
  ["🟫", "🟫", "🟫", "🟫", "⬜", "⬜", "⬜", "⬜", "🟫", "🟫", "🟫", "🟫"],
];

// draw tool that updates the SSE with transport.send() messages
mcp.registerTool(
  "draw",
  {
    title: "draw",
    description: "produces unicode individual strings in a SSE stream",
    inputSchema: { delayMs: z.number(), stream: z.boolean() },
    outputSchema: { result: z.string() },
  },
  async ({ delayMs, stream }, ctx) => {
    const { sessionId } = ctx;
    console.log("[unicode-server] sessionId:", sessionId);

    if (!sessionId) {
      console.log("[unicode-server] no session");
      const result = { result: "no session" };
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
        structuredContent: result,
      };
    }
    const transport = sessions.get(sessionId);

    if (!sessions.has(sessionId) || transport === undefined) {
      const result = { result: "no session matched" };
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
        structuredContent: result,
      };
    }

    // this should run later.  right now its in this tool for convenience.
    // using delayMS and unawaited promise to return before this starts
    // hopefully.  this is just a mock MCP server for demo purposes.
    // this feature would be kicked off by an unawaited promise
    // or set timeout to m
    // ake sure return reaches the client before
    // sending over SSE
    (async () => {
      if (!stream) {
        let artString = "";
        await new Promise((r) => setTimeout(r, delayMs));
        for (let i = 0; i < artArray.length; i++) {
          for (let j = 0; j < artArray[i].length; j++) {
            artString += artArray[i][j];
          }
          artString += "\n";
        }
        console.log(artString);
        await transport.send({
          jsonrpc: "2.0",
          method: "notifications/message",
          params: {
            level: "info",
            message: artString,
          },
        });
        return;
      }
      for (let i = 0; i < artArray.length; i++) {
        for (let j = 0; j < artArray[i].length; j++) {
          await new Promise((r) => setTimeout(r, delayMs));
          console.log("[unicode-server] sending:", artArray[i][j]);
          await transport.send({
            jsonrpc: "2.0",
            method: "notifications/message",
            params: {
              level: "info",
              message: artArray[i][j],
              row: String(i),
              col: String(j),
            },
          });
        }
        // sending newline at the end of each row.
        // would put this in art but it gets messed up because of prettier
        // formatting =(.
        await new Promise((r) => setTimeout(r, delayMs));
        console.log("[unicode-server] sending:", "\\n");
        await transport.send({
          jsonrpc: "2.0",
          method: "notifications/message",
          params: {
            level: "info",
            message: "\n",
            row: String(i),
            col: String(artArray[i].length),
          },
        });
      }
    })();

    const result = { result: `ok ${delayMs}` };
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
      structuredContent: result,
    };
  }
);

// endpoint for created th sse connection
app.get("/sse", async (_req, res) => {
  console.log("[unicode-server] connecting /sse");
  const transport = new SSEServerTransport("/messages", res);
  sessions.set(transport.sessionId, transport);

  res.on("close", () => {
    sessions.delete(transport.sessionId);
    transport.close();
  });

  await mcp.connect(transport);
});

// endpoint for handling other non SSE stuff like tool calls
// POST /messages or /messages/:sessionId JSON-RPC calls
app.post(["/messages", "/messages/:sessionId"], async (req, res) => {
  console.log("[unicode-server] received messages post request");

  // /messages/:sessionId
  const paramId = (req.params as any)?.sessionId as string | undefined;
  // /messages?sessionId=
  const queryId = (req.query?.sessionId as string) || undefined;
  const headerId = (req.header("mcp-session-id") as string) || undefined;

  const sessionId = paramId || queryId || headerId || "";
  const transport = sessions.get(sessionId);

  if (!transport) {
    console.error(
      "[unicode-server] Error; No transport for sessionId:",
      sessionId,
      "path:",
      req.path
    );
    return res.status(400).send("No transport for sessionId");
  }

  await transport.handlePostMessage(req, res, req.body);
});

app.listen(port, () => {
  console.log("[unicode-server] unicode MCP SSE server running.");
  console.log(`[unicode-server] Listening on http://localhost:${port}`);
  console.log(`[unicode-server] GET /sse, POST /messages`);
});
