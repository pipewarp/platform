import { cliRunAction } from "../../src/commands/run/run.cmd.js";
import { RunMockServer } from "../mock-mcp/mock-server.js";
import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs";
import { cwd } from "process";
import { resolve } from "path";

describe("cli run command e2e test", () => {
  beforeAll(async () => {
    await RunMockServer();
  });

  const waitForFile = async (
    filePath: string,
    maxTries: number,
    waitMs: number = 1000
  ): Promise<boolean> => {
    let tries = 0;
    let fileExists = fs.existsSync(filePath);
    while (!fileExists && tries <= maxTries) {
      console.log("Looking for file: ", tries);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      fileExists = fs.existsSync(filePath);
      tries++;
    }

    return fileExists;
  };

  it("should output a proper json file", async () => {
    const outPath = "./test-run.json";
    const resolvedOutPath = resolve(cwd(), outPath);
    const result = await cliRunAction("./tests/fixtures/test-flow.json", {
      test: true,
      out: outPath,
    });

    const fileExists = await waitForFile(resolvedOutPath, 10);
    if (fileExists) {
      const raw = fs.readFileSync(resolvedOutPath, { encoding: "utf-8" });
      const json = JSON.parse(raw);
      expect(json.runId).toBe("test-run-id");

      fs.unlinkSync(outPath);
    }
  });
});
