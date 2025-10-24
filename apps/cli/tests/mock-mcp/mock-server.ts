import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

console.log("Creating Mock Server");
const server = new McpServer({
  name: "mcp-server",
  version: "0",
});

console.log("Registering Mock Tool");
server.registerTool(
  "echo",
  {
    title: "Mock Stt Tool Transcribe",
    description: "Transcribes speech to text",
    inputSchema: { text: z.string() },
    outputSchema: {
      text: z.string(),
    },
  },
  async ({ text }) => ({
    content: [{ type: "text", text: String(text) }],
    structuredContent: { text: text },
  })
);

const transport = new StdioServerTransport();
console.log("Connecting Over Stdio");
const response = await server.connect(transport);
console.log(response);
