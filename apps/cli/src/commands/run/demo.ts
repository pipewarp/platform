import { ChildProcess, spawn } from "child_process";
import { resolveCliPath } from "../../resolve-path.js";

// assume process was invoked from project root
type ManagedProcess = {
  label: string;
  child: ChildProcess;
};

async function spawnServer(
  label: string,
  absolutePath: string,
  port: number
): Promise<ManagedProcess | undefined> {
  const child = spawn("node", [absolutePath], {
    stdio: "inherit",
    detached: false,
  });

  console.log(`[demo] started ${label} server (pid: ${child.pid})`);

  let i = 0;
  let result;
  console.log(`[demo] started ${label} server (pid: ${child.pid})`);
  for (let i = 0; i < 30; i++) {
    try {
      result = await fetch(`http://localhost:${port}/health`);
      break;
    } catch {
      await new Promise((r) => {
        setTimeout(r, 1000);
      });
      continue;
    }
  }

  if (!result) {
    console.error(`Unable to start server ${label} on localhost port ${port}`);
    return;
  }

  child.on("exit", (code, signal) => {
    console.log(
      `[demo] ${label} server exited with code ${code ?? "null"} signal ${
        signal ?? "null"
      }`
    );
  });

  child.on("error", (error) => {
    console.error(`[demo] failed to start ${label} server`, error);
  });

  return { label, child };
}

export async function startDemoServers(): Promise<
  ManagedProcess[] | undefined
> {
  // paths relative from project root
  // must be run from project root
  const transformRelPath = "examples/dist/transform.server.js";
  const unicodeRelPath = "examples/dist/unicode.server.js";
  const transformAbsPath = resolveCliPath(transformRelPath);
  const unicodeAbsPath = resolveCliPath(unicodeRelPath);

  const unicodeChild: ManagedProcess | undefined = await spawnServer(
    "unicode",
    unicodeAbsPath,
    3004
  );

  const transformChild: ManagedProcess | undefined = await spawnServer(
    "unicode",
    transformAbsPath,
    3005
  );

  if (!unicodeChild || !transformChild) {
    console.error("[demo] error setting up mcp servers");
    return;
  }

  return [unicodeChild, transformChild];
}
