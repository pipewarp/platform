import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

export type McpDb = {
  client: Client;
  concurrency: number;
  running: number;
  server: string;
};

export type McpId = string;

export class McpManager {
  mcps = new Map<McpId, McpDb>();
  constructor() {}

  add(mcpId: McpId, client: McpDb): void {
    this.mcps.set(mcpId, client);
  }
  has(mcpId: McpId): boolean {
    return this.mcps.has(mcpId);
  }

  get(mcpId: McpId): McpDb | false {
    if (!this.mcps.has(mcpId)) return false;
    const mcp = this.mcps.get(mcpId);
    if (!mcp) return false;
    return mcp;
  }
  async addStdioClient(server: string, mcpId: McpId) {
    const transport = new StdioClientTransport({
      command: "node",
      // args: ["src/infra/mcp/mcp-server.ts"],
      args: [server],
    });
    const client = new Client(
      { name: mcpId, version: "0.0.0" },
      { capabilities: {} }
    );
    const response = await client.connect(transport);

    console.log(`[mcp manager] adding connected client ${mcpId}`);
    this.mcps.set(mcpId, {
      client,
      concurrency: 1,
      running: 0,
      server,
    });
  }

  async addSseClient(
    url: string,
    mcpId: McpId,
    name: string,
    version: string = "0.0.0"
  ) {
    const client = new Client({
      name,
      version,
    });

    const transport = new SSEClientTransport(new URL(url));
    try {
      console.log(
        `[mcp manager] connected to mcp sse at ${url} with id ${mcpId}`
      );
      const response = await client.connect(transport);
      console.log(response);

      this.mcps.set(mcpId, { client, concurrency: 1, running: 0, server: url });
    } catch (error) {
      console.error(`[mcp manager] failed to connect mcp sse ${url}: ${error}`);
    }
  }

  // Makes the class directly async iterable
  async *[Symbol.asyncIterator](): AsyncGenerator<
    [McpId, McpDb],
    void,
    unknown
  > {
    for (const [mcpId, mcpDb] of this.mcps) {
      yield [mcpId, mcpDb];
    }
  }
}
