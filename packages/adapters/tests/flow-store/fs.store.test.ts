import { describe, it, expect, vi, afterEach } from "vitest";
import { FlowStoreFs } from "../../src/flow-store/fs.store.js";
import fs from "fs";
import path from "node:path";

describe("FlowStoreFs", () => {
  afterEach(() => { 
    vi.restoreAllMocks();
  });
  it("throws when readFlow is given a relative dir path", () => {
    const flowStore = new FlowStoreFs();
    expect(() => { flowStore.readFlows({ dir: "./" }) }).toThrow();
  });
    it("throws when readFlow is given an undefined dir path", () => {
    const flowStore = new FlowStoreFs();
    expect(() => { flowStore.readFlows({ dir: undefined }) }).toThrow();
  });
  it("readFlows() returns map size of 0 when all readFlow() calls return undefined", () => {
    const flowStore = new FlowStoreFs();

    vi.spyOn(fs, "readdirSync").mockReturnValue(["file.flow.json"] as any);

    const readFlowSpy = vi.spyOn(flowStore, "readFlow").mockReturnValue(undefined);
    const flows = flowStore.readFlows({ dir: "/" });

    expect(flows.size).toBe(0);
    expect(readFlowSpy).toHaveBeenCalledOnce();
  });
  
  it("readFlow() returns map size of 0 when readdir returns empty array", () => {
    const flowStore = new FlowStoreFs();

    const readdirSpy = vi.spyOn(fs, "readdirSync").mockReturnValue([]);
    const flows = flowStore.readFlows({ dir: "/" });

    expect(flows.size).toBe(0);
    expect(readdirSpy).toHaveBeenCalledOnce();
  });
  
  it("has map size of 1 when one valid extension is found in the directory", () => {
    const flowStore = new FlowStoreFs();

    vi.spyOn(fs, "readdirSync").mockReturnValue(["file.flow.json"] as any);
    const readFlowSpy = vi.spyOn(flowStore, "readFlow").mockReturnValue(new Map([["test.flow.json", "blob"]]));
    const flows = flowStore.readFlows({ dir: "/" });

    expect(flows.size).toBe(1);
    expect(readFlowSpy).toHaveBeenCalledOnce();
  });

  it("omits files without .flow.json extention", () => {
    const flowStore = new FlowStoreFs();

    const readdirSpy = vi.spyOn(fs, "readdirSync").mockReturnValue(["file.flow.jso", "file.json"] as any);
    const flows = flowStore.readFlows({ dir: "/" });

    expect(flows.size).toBe(0);
    expect(readdirSpy).toHaveBeenCalledOnce();
  });

  it("readFlow() returns undefined when file size > 5 MB", () => {
    const flowStore = new FlowStoreFs();

    vi.spyOn(fs, "statSync").mockReturnValue({size: 5000001, isFile: true} as any);
    vi.spyOn(path, "extname").mockReturnValue(".json" as any);
    vi.spyOn(path, "isAbsolute").mockReturnValue(true);

    const flows = flowStore.readFlow({ filePath: "/" });

    expect(flows).toBe(undefined);
  });
  it("readFlow() returns undefined when path is not a file", () => {
    const flowStore = new FlowStoreFs();

    vi.spyOn(fs, "statSync").mockReturnValue({size: 500000, isFile: false} as any);
    vi.spyOn(path, "extname").mockReturnValue(".json" as any);
    vi.spyOn(path, "isAbsolute").mockReturnValue(true);

    const flows = flowStore.readFlow({ filePath: "/" });

    expect(flows).toBe(undefined);
    });
  it("readFlow() returns undefined file path supplied doesn't end with .flow.json", () => {
    const flowStore = new FlowStoreFs();

    vi.spyOn(fs, "statSync").mockReturnValue({size: 500000, isFile: true} as any);
    vi.spyOn(path, "extname").mockReturnValue(".json" as any);
    vi.spyOn(path, "isAbsolute").mockReturnValue(true);

    const flows = flowStore.readFlow({ filePath: "/" });

    expect(flows).toBe(undefined);
  });
    it("readFlow() returns undefined file path read doesnt end with .json", () => {
    const flowStore = new FlowStoreFs();

    vi.spyOn(fs, "statSync").mockReturnValue({size: 500000, isFile: true} as any);
    vi.spyOn(path, "extname").mockReturnValue(".jso" as any);
    vi.spyOn(path, "isAbsolute").mockReturnValue(true);

    const flows = flowStore.readFlow({ filePath: "/test.flow.json" });

    expect(flows).toBe(undefined);
  });
});


