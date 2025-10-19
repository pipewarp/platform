import { ChildProcess, spawn } from "child_process";
import { resolveCliPath } from "../../resolve-path.js";

// assume process was invoked from cwd
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

  // return function shutdown(): void {
  //   if (shuttingDown) return;
  //   shuttingDown = true;

  //   console.log("[demo] shutting down demo servers...");

  //   for (const { label, child } of processes) {
  //     if (child.exitCode !== null || child.killed) {
  //       continue;
  //     }

  //     const signal = process.platform === "win32" ? undefined : "SIGTERM";

  //     try {
  //       child.kill(signal);
  //     } catch (error) {
  //       console.error(`[demo] failed to send signal to ${label} server`, error);
  //     }
  //   }
  // };
}

// async function startServer(cmd: string, args: string[], port: number) {
//   const proc = spawn(cmd, args, { stdio: "inherit" });
//   await waitForPort(port);
//   return proc;
// }

// async function waitForPort(port: number) {
//   while (true) {
//     try {
//       await fetch(`http://localhost:${port}/health`);
//       return;
//     } catch {
//       await new Promise((r) => setTimeout(r, 200));
//     }
//   }
// }

// export async function runDemo() {
//   const a = await startServer("node", ["./mcp-server-a.js"], 3001);
//   const b = await startServer("node", ["./mcp-server-b.js"], 3002);

//   await runFlow(); // your demo logic

//   a.kill();
//   b.kill();
// }

// import { spawn } from "node:child_process";

// const children: import("node:child_process").ChildProcess[] = [];

// function startServer(cmd: string, args: string[], port: number) {
//   const proc = spawn(cmd, args, { stdio: "inherit" });
//   children.push(proc);
//   return proc;
// }

// function shutdown() {
//   for (const child of children) {
//     if (!child.killed) {
//       child.kill("SIGTERM");
//     }
//   }
//   process.exit();
// }

// process.on("SIGINT", shutdown);
// process.on("SIGTERM", shutdown);
// process.on("exit", shutdown);

// export async function runDemo() {
//   startServer("node", ["./mcp-server-a.js"], 3001);
//   startServer("node", ["./mcp-server-b.js"], 3002);

//   // your Commander CLI will keep running
//   console.log("Demo running. Press Ctrl+C to stop servers.");
// }
// spawn(cmd, args, { stdio: "inherit", detached: false });
