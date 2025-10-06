import { before } from "node:test";
import { cliRunAction } from "../../src/commands/run/run.cmd.js";
import { RunMockServer } from "../mock-mcp/mock-server.js";
import { describe, it, expect, beforeAll } from "vitest";

describe("cli run command e2e test", () => {
  beforeAll(async () => {
    await RunMockServer();
  });
  it("should return certain values", async () => {
    const result = await cliRunAction("./tests/fixtures/test-flow.json", "");

    expect(result).toBeUndefined();
  });
});
