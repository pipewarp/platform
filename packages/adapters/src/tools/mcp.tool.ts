import type { ToolContext, ToolPort } from "@pipewarp/ports";
import type { StepMcpQueuedData, AnyEvent } from "@pipewarp/types";
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
    const event = input as AnyEvent<"step.mcp.queued">;
    await this.connect(event.data.url);
    const result = await this.#client.callTool({
      name: event.data.feature.name,
      ...(event.data.args ? { arguments: event.data.args } : {}),
    });

    return result;
  }

  async connect(url: string) {
    const transport = new SSEClientTransport(new URL(url));
    await this.#client.connect(transport);
  }
}
