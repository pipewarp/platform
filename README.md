# pipewarp

### ❗ Alpha Software (v0.1.0-alpha.3)

This software provides minimal functionality. Interfaces and behavior will evolve over time. Expect breaking changes between versions.

## Overview

Pipewarp is a local first workflow engine designed for flexibly in orchestrating resources utilized AI workflows, such as MCP servers, LLMs, RAG, etc. It focuses on realtime streaming, acomposable components for flexible installs, and great developer experience. Flows should offer a strong set of features for a variety of applications. Built in observability, historical analysis, and a focus on eval workflows are longterm goals.

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

Run a demo flow [examples/art-stream.flow.json](examples/art-stream.flow.json) with two demo MCP servers.

Example (with optional manual separate terminal start of transform - _luigi_ - MCP server):

![Art Streaming Demo Terminal Example](art-streaming-demo.gif)

Must run from repo root (runs mcp servers as child proceses :

```bash
# streaming workflow; spawns child processes in one terminal
pnpm -F @pipewarp/cli start run examples/art-stream.flow.json -d
# non streaming workflow
pnpm -F @pipewarp/cli start run examples/art.flow.json -d
```

The streaming flow definition:

```jsonc
{
  "name": "art-stream",
  "start": "mario",
  "steps": {
    "mario": {
      "type": "action",
      "tool": "unicode",
      "op": "draw",
      "args": {
        "delayMs": 100, // time between character streaming emissions
        "useStream": true // run mcp server in stream mode
      },
      "pipe": {
        "to": {
          "step": "luigi", // pipe SSE output to luigi step, executed in parallel
          "payload": "params.message" // pluck output message as stream payload
        }
      }
    },
    "luigi": {
      "type": "action",
      "tool": "transform",
      "op": "transform",
      "args": {
        "art": "$.pipe", // use pipe payload value for this argument
        "useStream": true,
        "delayMs": 10
      },
      "pipe": {
        "from": {
          "step": "mario", // pipe SSE from mario into lugio step
          "buffer": 13 // how many characters to buffer before calling transform tool
        }
      }
    }
  }
}
```

This cli run command, when run with this flow and the `-d` or `--demo` option, from the repo root, does the following steps:

1. Starts up two localhost MCP servers on ports 3004 and 3005 for each step as child processes. These are found at:

   - [examples/mcp-servers/unicode.server.ts](examples/mcp-servers/unicode.server.ts)
   - [examples/mcp-servers/tranform.server.ts](examples/mcp-servers/transform.server.ts)

2. Runs the flow `examples/art-stream.flow.json` as shown above.

3. The first step named `mario` calls an mcp server with id `unicode` and invokes the tool operation named `draw`. It passes args to it to alter its behavior. This tool produces unicode art that resembles mario, streamed from an SSE endpoint. This output is piped to the luigi step.

4. In parallel, the step named `luigi` is executed. It calls an mcp server with an id of `transform` and calls the tool operation called `transform` with specific arguments. The interpolated string `$.pipe` refers to the streaming output of the `mario` step. The `transform` tool takes unicode characters and swaps specific colors of characters, to produce a "luigi" similar unicode art piece. That output is streamed over SSE.

5. The engine's `RunContext` is saved as `output.temp.json` in the root of the repo. It contains details about the run, including the output from each step.

See [apps/cli/README.md](apps/cli/README.md) for more details about the cli.

## cli e2e test

You can run a basic flow test for success and failure from project root:

```
pnpm test:e2e
```

These tests use an stdio mcp server and basic flows to generate `output.json` files at `apps/cli/tests/temp/`. The tests read from generated file to look for specific RunContext fields. This is gust a raw and basic way to test if the engine is working to some degree. Future versions could hook into lifecycle events instead of reading from files.

## unit tests

You can run unit tests for the stream core and stream registry:

```
pnpm test
```

Further test coverage will grow as the architecture is cemented. Large breaking changes are still in process.

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

## Release v0.1.0-alpha.3 highlights

- In process registry based stream system.
- One producer -> consumer per stream id.
- Async iterable contract (consumer pulls, producer yieds)
- Engine wires up ephemeral streams for steps that need them, does not relay data directly.
- Basic lifecycle of open, active, close, no retry logic.
- Minimal backpressure with `await`. Stream buffers internally with in memory simple FIFO queue.
- Uses demo servers to demonstrate a streamable flow cli demo for streaming.
- Abtracted step handlers out of the engine.

## Next for alpha.4

Possible next changes:

- Refactor worker in a generic tool invoker.
- Refactor mcp worker + mcp manager
- Implement a capabilities/profile system for step abtraction and persistance.
- Add additional basic step types.
- Integrate real STT, TTS, and LLM tools to test workflow use cases.
- Upgrade cli to proper wrapper around an application.
