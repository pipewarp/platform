# pipewarp

### ❗ Alpha Software (v0.1.0-alpha.4)

Pipewarp is in an early alpha stage and still taking shape. Some things work - mostly - but APIs and behaviors will change as development evolves. Expect rough edges and breaking changes for now.

## Overview

Pipewarp is an event driven workflow engine built for flexibility and composibility. It's designed to run locally first, as a single process, and aims to make orchestrating complex systems, especially AI driven ones, feel simple, transparent, and powerful. Instead of enforcing rigid rules, Pipewarp's goal is to make things possible: to connect tools, services, and data streams in whatever way fits your use case.

Under the hood, Pipewarp treats streaming as a first-class citizen. Also, every component, from queues to workers, communicates through events, allowing generic components with swappable infrastructure. The architecture is modular and extensible, supporting everything from lightweight in-memory execution to distributed setups. Built-in observability is a core goal, with plans for integrated dashboard and support for external monitoring tools, making it easy to understand what your flows are doing at every stage.

## Quickstart

### package managers

This monorepo uses [pnpm](https://pnpm.io/) via [Corepack](https://github.com/nodejs/corepack), and can be built with [turborepo](https://turborepo.com/). If you don't have pnpm installed globally, enable corepack (bundled with Node 16.10+):

```bash
corepack enable
```

Post alpha versions of this repo will support other package managers.

### 1. install + build

```bash
pnpm install
pnpm build
```

### 2. run demo

#### Demo flow executed with two localhost SSE streaming MCP servers

![Art Streaming Demo Terminal Example](art-streaming-demo.gif)

#### Run Commands

```bash
# streaming workflow; spawns child processes in one terminal
pnpm -F @pipewarp/cli start run examples/demo.streaming.flow.json -d
# non streaming workflow
pnpm -F @pipewarp/cli start run examples/demo.flow.json -d
```

#### Streaming Flow Definition ([examples/demo.streaming.flow.json](examples/demo.streaming.flow.json))

```json
{
  "name": "demo.streaming.flow.json",
  "start": "mario",
  "steps": {
    "mario": {
      "type": "mcp",
      "url": "http://localhost:3004/sse",
      "transport": "sse",
      "args": {
        "delayMs": 100,
        "useStream": true
      },
      "feature": {
        "primitive": "tool",
        "name": "draw"
      },
      "on": {
        "success": "luigi"
      },
      "pipe": {
        "to": {
          "step": "luigi",
          "payload": "params.message"
        }
      }
    },
    "luigi": {
      "type": "mcp",
      "url": "http://localhost:3005/sse",
      "transport": "sse",
      "args": {
        "art": "$.pipe",
        "useStream": true,
        "delayMs": 100
      },
      "feature": {
        "primitive": "tool",
        "name": "transform"
      },
      "pipe": {
        "from": {
          "step": "mario",
          "buffer": 13
        }
      }
    }
  }
}
```

This cli run command, when run with this flow and the `-d` or `--demo` option, from the repo root, performs the following steps:

1. Starts up two localhost MCP servers on ports 3004 and 3005 for each step as child processes. These are found at:

   - [examples/mcp-servers/unicode.server.ts](examples/mcp-servers/unicode.server.ts)
   - [examples/mcp-servers/tranform.server.ts](examples/mcp-servers/transform.server.ts)

2. Runs the flow `examples/demo.streaming.flow.json` as shown above.

3. The first step named `mario` calls an mcp server and invokes the tool operation named `draw`. It passes args to it to alter its behavior. This tool produces unicode art that resembles mario, streamed from an SSE endpoint. This output is piped to the luigi step.

4. In parallel (single threaded), the step named `luigi` is executed. It contacts an mcp server and runs a tool called `transform` with specific arguments. The interpolated string `$.pipe` refers to the streaming output of the `mario` step. The `transform` tool takes unicode characters and swaps specific colors of characters, to produce a "luigi" styled unicode output. That output is streamed over SSE and not captured in the flow (duplex streaming not yet supported).

5. The engine's `RunContext` is saved as `output.temp.json` in the root of the repo. It contains details about the run, including the output from each step's tool invocation.

See [apps/cli/README.md](apps/cli/README.md) for more details about the cli.

## cli e2e test

You can run a basic flow test for success and failure from project root:

```
pnpm test:e2e
```

These tests use an stdio mcp server and basic flows to generate `output.json` files at `apps/cli/tests/temp/`. The tests read from the generated file to look for specific RunContext fields. This is just a raw and basic way to test if the engine is working to some degree. Future versions could hook into lifecycle events instead of reading from files.

## unit tests

You can run unit tests for the stream core, stream registry, worker, and queues.

```
pnpm test
```

Further test coverage will grow as the architecture is cemented. Large breaking changes are still in process.

## Monorepo Packages

| Package                | Purpose                               |
| ---------------------- | ------------------------------------- |
| **@pipewarp/types**    | Shared types across packages.         |
| **@pipewarp/ports**    | Ports and their supporting types.     |
| **@pipewarp/specs**    | Flow specification types.             |
| **@pipewarp/events**   | Event schemas and helper functions.   |
| **@pipewarp/adapters** | Implementations of ports.             |
| **@pipewarp/engine**   | Event driven workflow engine.         |
| **@pipewarp/cli**      | CLI for running and validating flows. |
| **@pipewarp/examples** | Example / demo flows and servers.     |

## Alpha 4 highlights: release v0.1.0-alpha.4

### Generic Worker with Capabilities and Tools, and refactored Types

- New `@pipewarp/types` package centralizes type creation.
- New `@pipewarp/events` package provides zod schemas for events and an EmitterFactory helper function
- Generic **worker** now orchestrates jobs and binds capabilities with tools.
- New **mcp tool** now handles all generic logic for mcp clients.

This release is mostly an architectural shift on the worker/tool side, as well
as removing zod for all types, and creating pure typescript as the base for
clean importing across packages.

## Next for Alpha 5

### Observability

- Remove most debug console logs from individual components.
- Emit lifecycle events across components.
- Provide a color coded console log observability layer with verbose options.
- Basic visual observability dashboard on localhost websocket.

### Event Formalization

- More formalized event types and structure.
- Helper function for listening to events.
- Scoped emitters for each event type.
- Components should emit lifecycle events that adhere to a common set of states.

## Beyond Alpha 5

- New tool types (http, websocket, subprocess, etc)
- New control flow types (branching, parallel, wait, etc)
- Workflow as server or daemon long running process.
- Persistance for modules as json/sqlite.
- Redis infra adapter per component.
