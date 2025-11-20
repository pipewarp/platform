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
  version: "0.1.0-alpha.6",
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

const TransformOutputSchema = z.object({
  ok: z.boolean(),
  data: z.string().optional(),
  message: z.string().optional(),
});
type TranformOutput = z.infer<typeof TransformOutputSchema>;

let buffer = "";

mcp.registerTool(
  "transform",
  {
    title: "transform",
    description: "converts unicode characters to an alternate color",
    inputSchema: {
      delayMs: z.number(),
      art: z.string(),
      useStream: z.boolean(),
    },
    outputSchema: {
      ok: z.boolean(),
      data: z.string().optional(),
      message: z.string().optional(),
    },
  },
  async ({ delayMs, art, useStream }, ctx) => {
    const { sessionId } = ctx;
    console.log("[transform-server] sessionId:", sessionId);

    console.log("[transform-server] client sent:", art);

    if (!sessionId) {
      console.log("[transform-server] no session");
      const output: TranformOutput = {
        ok: false,
        message: "no sessionId provided",
      };
      return {
        content: [{ type: "text", text: JSON.stringify(output) }],
        structuredContent: output,
      };
    }
    const transport = sessions.get(sessionId);

    if (!sessions.has(sessionId) || transport === undefined) {
      const output: TranformOutput = { ok: false, message: "invalid session" };
      return {
        content: [{ type: "text", text: JSON.stringify(output) }],
        structuredContent: output,
      };
    }

    // should move this out eventually as own thing, but this is just a demo
    (async () => {
      if (!useStream) return;
      await new Promise((r) => setTimeout(r, delayMs));
      let newArt = "";

      const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
      const chars = [...segmenter.segment(art)].map((seg) => seg.segment);

      for (const char of chars) {
        newArt += characterSwap.get(char) ?? char;
      }
      buffer += newArt;
      console.log("[transform-server] sending:", newArt);
      console.log(`[transform-server] full SSE Buffer:\n${buffer}`);
      await transport.send({
        jsonrpc: "2.0",
        method: "notifications/message",
        params: {
          level: "info",
          message: newArt,
        },
      });
    })();

    let newArt = "";

    const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
    const chars = [...segmenter.segment(art)].map((seg) => seg.segment);

    for (const char of chars) {
      newArt += characterSwap.get(char) ?? char;
    }
    const output: TranformOutput = {
      ok: true,
      data: newArt,
    };
    return {
      content: [{ type: "text", text: output.data ?? "" }],
      structuredContent: output,
    };

    return {
      content: [{ type: "text", text: art }],
      structuredContent: { ok: true },
    };
  }
);
app.get("/health", async (req, res) => {
  return res.status(200).send("ok");
});
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

process.on("SIGINT", () => {
  for (const [id, transport] of sessions.entries()) {
    transport.close();
  }
  sessions.clear();
  process.exit();
});
process.on("SIGTERM", () => {
  for (const [id, transport] of sessions.entries()) {
    transport.close();
  }
  sessions.clear();
  process.exit();
});