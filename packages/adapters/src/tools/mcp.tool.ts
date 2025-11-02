import type { ToolContext, ToolPort } from "@pipewarp/ports";
import type { StepMcpQueuedData } from "@pipewarp/types";
import { Client } from "@modelcontextprotocol/sdk/client";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

export class McpTool implements ToolPort {
  id = "mcp-sse-tool";
  name = "MCP SSE Tool";
  #client: Client;
  constructor() {
    this.#client = new Client({ name: "mcp-tool", version: "0.1.0-alpha.3" });
  }
  async invoke(input: unknown, context: ToolContext): Promise<unknown> {
    console.log(`[tool-mcp] ${input}`);
    const data = input as StepMcpQueuedData;
    await this.connect(data.url);
    const result = await this.#client.callTool({
      name: data.feature.name,
      ...(data.args ? { arguments: data.args } : {}),
    });
    console.log(`[tool-mcp] result:${JSON.stringify(result, null, 2)}`);
    return result;
  }

  async connect(url: string) {
    const transport = new SSEClientTransport(new URL(url));
    await this.#client.connect(transport);
  }
}
