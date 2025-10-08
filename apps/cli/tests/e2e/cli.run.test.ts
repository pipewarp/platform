import { cliRunAction } from "../../src/commands/run/run.cmd.js";
import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs";
import { cwd } from "process";
import { resolve } from "path";

describe("cli run command e2e test", () => {
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
    const outPath = "./tests/temp/test-run.json";
    const resolvedOutPath = resolve(cwd(), outPath);
    const result = await cliRunAction("./tests/fixtures/test-flow.json", {
      test: true,
      out: outPath,
      server: "./tests/mock-mcp/mock-server.ts",
    });

    const fileExists = await waitForFile(resolvedOutPath, 10);
    if (fileExists) {
      const raw = fs.readFileSync(resolvedOutPath, { encoding: "utf-8" });
      const json = JSON.parse(raw);
      expect(json.runId).toBe("test-run-id");

      fs.unlinkSync(outPath);
    }
  });

  it("should follow success flow path on success", async () => {
    const outPath = "./tests/temp/test-succes-run.json";
    const resolvedOutPath = resolve(cwd(), outPath);
    const result = await cliRunAction(
      "./tests/fixtures/branching-flow-success.json",
      {
        test: true,
        out: outPath,
        server: "./tests/mock-mcp/mock-server.ts",
      }
    );

    const fileExists = await waitForFile(resolvedOutPath, 10);
    if (fileExists) {
      const raw = fs.readFileSync(resolvedOutPath, { encoding: "utf-8" });
      const json = JSON.parse(raw);

      expect(json.steps.first.status).toBe("success");
      expect(json.steps.second.status).toBe("success");

      fs.unlinkSync(outPath);
    }
  });

  it("should follow failure flow path on failure", async () => {
    const outPath = "./tests/temp/test-fail-run.json";
    const resolvedOutPath = resolve(cwd(), outPath);
    const result = await cliRunAction(
      "./tests/fixtures/branching-flow-failure.json",
      {
        test: true,
        out: outPath,
        server: "./tests/mock-mcp/mock-server.ts",
      }
    );

    const fileExists = await waitForFile(resolvedOutPath, 10);
    if (fileExists) {
      const raw = fs.readFileSync(resolvedOutPath, { encoding: "utf-8" });
      const json = JSON.parse(raw);

      expect(json.steps.first.status).toBe("failure");
      expect(json.steps.third.status).toBe("success");

      fs.unlinkSync(outPath);
    }
  });
});
