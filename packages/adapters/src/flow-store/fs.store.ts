import type { FlowStorePort } from "@pipewarp/ports";
import fs from "fs";
import path from "path";

export class FlowStoreFs implements FlowStorePort {
  readFlow(args: { filePath?: string }): unknown {
    const { filePath } = args;
    if (!filePath) {
      throw new Error("[flow-store-fs] readFlow must supply a path.");
    }
    const stats = fs.statSync(filePath);
    
    // skip non files or if the file is greater than ~ 5 MB
    if (!stats.isFile || stats.size > 5000000) return;
    
    if (path.extname(filePath) !== ".json" || !filePath.endsWith(".flow.json")) return;
    if (!path.isAbsolute(filePath)) return;
    
    try {
      const blob = fs.readFileSync(filePath, { encoding: "utf-8" });
      return blob;
    }
    catch (err) {
      console.error(`[flow-store-fs] error reading ${filePath}: ${err}`);
      return;
    }
  }

  readFlows(args: {dir?: string}): Map<string, unknown> {
    const { dir } = args;
    if (!dir) throw new Error("[flow-store-fs] must provide a directory");
    if (!path.isAbsolute(dir)) throw new Error("[flow-store-fs] dir must be absolute");

    const contents = fs.readdirSync(dir, { encoding: "utf-8" });
    
    const flows = new Map<string, unknown>();
    
    for (const filePath of contents) { 
      if (filePath.endsWith(".flow.json")) { 
        const blob = this.readFlow({ filePath });
        if (blob !== undefined) flows.set(filePath, blob);
      }
    }
    return flows;
  }
} 