# pipewarp

## v0.1.0-alpha.2

### ⓘ Alpha Software

This software provides minimal functionality. Interfaces and behavior will evolve over time, expect breaking changes between versions.

## Overview

Pipewarp is a local first workflow engine designed to orchestrate MCP servers and other supporting AI resources. It focuses on realtime streaming in and out between tools, observability, flexibility in deployment, and scalability.

Currently it runs Zod defined JSON flows that describe ordered steps, routes success and failure paths, and creates results for later analysis.

## Quickstart

### package managers

This monorepo uses [pnpm](https://pnpm.io/) via [Corepack](https://github.com/nodejs/corepack), and can build with [turborepo](https://turborepo.com/). If you dont have pnpm installed globally, enable corepack (bundled with Node 16.10+):

```bash
corepack enable
```

_Post alpha versions of this repo should fully support other package managers._

### 1. install + build

```bash
pnpm install
pnpm build
```

### 2. run demo

Run a demo flow [examples/art.flow.json](examples/art.flow.json) with two demo MCP servers.

Must run from repo root:

```bash
pnpm -F @pipewarp/cli start run examples/art.flow.json -d
```

The flow definition looks like this:

```jsonc
{
  "name": "unicode-art",
  "start": "mario",
  "steps": {
    "mario": {
      "type": "action",
      "tool": "unicode",
      "op": "draw",
      "args": {
        "delayMs": 25,
        "useStream": false
      },
      "on": {
        "success": "luigi"
      }
    },
    "luigi": {
      "type": "action",
      "tool": "transform",
      "op": "transform",
      "args": {
        "art": "${steps.mario.text}",
        "isStreaming": false,
        "delayMs": 10
      }
    }
  }
}
```

This cli run command, when run with this flow and the `-d` or `--demo` option, from the repo root, does the following steps:

1. Starts up two localhost MCP servers on ports 3004 and 3005 for each step as child processes. These are found at:

   - [examples/mcp-servers/unicode.server.ts](examples/mcp-servers/unicode.server.ts)
   - [examples/mcp-servers/tranform.server.ts](examples/mcp-servers/tranform.server.ts)

2. Runs the flow `examples/art.flow.json` as shown above.

3. The first step named `mario` calls an mcp server with id `unicode` and invokes the tool operation named `draw`. It passes args to it to alter its behavior. This tool produces unicode art that resembles mario.

4. On success, the step named `luigi` is executed. It calls an mcp server with an id of `transform` and calls the tool operation called `transform` with specific arguments. The interpolated string `${steps.mario.text}` refers to the output of the `mario` step. The `transform` tool takes unicode characters and swaps specific colors of characters, to produce a "luigi" similar unicode art piece.

5. The engine's `RunContext` is saved as output.json in the root of the repo. It contains details about the run, including the output from each step.

See [apps/cli/README.md](apps/cli/README.md) for more details about the cli.

## cli e2e test

You can run a basic flow test for success and failure from project root:

```
pnpm test:e2e
```

This test uses an stdio mcp server and basic flows to generate an output.json file. It reads that file to test for specific RunContext exptected results. Just a raw and basic way to test if the engine is working to some degree.

## Concepts

Basic concepts:

| Term        | Meaning                                                            |
| ----------- | ------------------------------------------------------------------ |
| **Flow**    | JSON file with named steps that perform actions                    |
| **Step**    | A single action (MCP tool call, HTTP request, Flow Control, etc.). |
| **Outcome** | `success` or `failure` result that determines the next step        |
| **Export**  | Values a step explicitely exposes to other steps                   |
| **Export**  | Values a step explicitely exposes to other steps                   |

## Monorepo Packages

| Package                | Purpose                               |
| ---------------------- | ------------------------------------- |
| **@pipewarp/ports**    | Ports and their supporting types      |
| **@pipewarp/specs**    | Flow Specs and core types             |
| **@pipewarp/adapters** | Implementations of ports.             |
| **@pipewarp/engine**   | Event driven workflow engine.         |
| **@pipewarp/cli**      | CLI for running and validating flows. |
| **@pipewarp/examples** | Example / demo flows and servers.     |

## Release v0.1.0-alpha.2 highlights

- Router, worker, and queue refactored outside of the engine
- More robust startup and teardown to avoid orphaned processes.
- Demo flow with two localhost MCP servers simulate real tools.

### Next Focus

- In process registry based stream system.
- One producer -> consumer per stream id.
- Async iterable contract (consumer pulls, producer yieds)
- Engine wires up ephemeral streams for steps that need them, does not relay data
- Basic lifecycle of open, active, close, no retry logic.
- Minimal backpressure with `await`. Producer reponsibility to buffer.
- Use demo servers to demonstrate a streamable flow cli demo for streaming.
