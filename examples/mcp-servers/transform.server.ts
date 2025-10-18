import express from "express";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

const app = express();
app.use(express.json());

// map transports to specific session ids (no auth)
const sessions = new Map<string, SSEServerTransport>();
const port = 3005;
const mcp = new McpServer({
  name: "transform-server",
  version: "0.1.0-alpha.1",
  capabilities: { logging: {} },
});

// transform characters to another character
const characterSwap = new Map<string, string>([
  ["🟦", "🟥"],
  ["🟧", "🟨"],
  ["🟥", "🟩"],
  ["⬛️", "🟩"],
  ["🟫", "🟩"],
]);

mcp.registerTool(
  "transform",
  {
    title: "transform",
    description: "converts unicode characters to an alternate color",
    inputSchema: {
      delayMs: z.number(),
      inputArt: z.array(z.string()),
    },
    outputSchema: { result: z.string() },
  },
  async ({ delayMs, inputArt }, ctx) => {
    const { sessionId } = ctx;
    console.log("[transform-server] sessionId:", sessionId);

    if (!sessionId) {
      console.log("[transform-server] no session");
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

    // should move this out eventually as own thing, but this is just a demo
    (async () => {
      await new Promise((r) => setTimeout(r, delayMs));
      let char = "";
      for (let i = 0; i < inputArt.length; i++) {
        char += characterSwap.get(inputArt[i]) ?? inputArt[i];
      }
      console.log("transform-server] sending:", char);
      await transport.send({
        jsonrpc: "2.0",
        method: "notifications/message",
        params: {
          level: "info",
          message: char,
        },
      });
    })();

    return {
      content: [],
      structuredContent: { result: "ok" },
    };
  }
);

// endpoint for created th sse connection
app.get("/sse", async (_req, res) => {
  console.log("[transform-server] connecting /sse");
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
  console.log("[transform-server] received messages post request");

  // /messages/:sessionId
  const paramId = (req.params as any)?.sessionId as string | undefined;
  // /messages?sessionId=
  const queryId = (req.query?.sessionId as string) || undefined;
  const headerId = (req.header("mcp-session-id") as string) || undefined;

  const sessionId = paramId || queryId || headerId || "";
  const transport = sessions.get(sessionId);

  if (!transport) {
    console.error(
      "[transform-server] Error; No transport for sessionId:",
      sessionId,
      "path:",
      req.path
    );
    return res.status(400).send("No transport for sessionId");
  }

  await transport.handlePostMessage(req, res, req.body);
});

app.listen(port, () => {
  console.log("[transform-server] ascii MCP SSE server running.");
  console.log(`[transform-server] Listening on http://localhost:${port}`);
  console.log(`[transform-server] GET /sse, POST /messages`);
});
