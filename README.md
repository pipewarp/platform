# pipewarp

## ⓘ Alpha Software

Functionality is minimal. Interfaces and behavior will evolve over time, expect breaking changes between versions.

## Overview

Pipewarp is a local first workflow engine designed to orchestrate MCP servers and other supporting AI pipeline actions.

It runs JSON defined flows that describe ordered steps, routes success and failure paths, and creates results for later analysis.

## Quickstart

```bash
pnpm install
pnpm build
pnpm -F @pipewarp/cli start run examples/branching-flow-success.json -o output.json
```

Outputs the run context and step results of an example flow to `output.json`

## Concepts

| Term        | Meaning                                                     |
| ----------- | ----------------------------------------------------------- |
| **Flow**    | JSON file with named steps that perform actions             |
| **Step**    | A single action (MCP tool call, HTTP request, etc.).        |
| **Outcome** | `success` or `failure` result that determines the next step |
| **Export**  | Values a step explicitely exposes to other steps            |

Today all steps call a Mock MCP tool over **stdio** connection.
Future adapters will include step calls over HTTP and offer local actions.

## Packages

| Package                | Purpose                               |
| ---------------------- | ------------------------------------- |
| **@pipewarp/core**     | Core Ports and Types.                 |
| **@pipewarp/adapters** | Implementations of core ports.        |
| **@pipewarp/engine**   | Engine, flow loader, routing.         |
| **@pipewarp/cli**      | CLI for running and validating flows. |
| **examples/**          | Sample flows used in docs.            |

## Roadmap

General outline of planned features

- Per step explicit exports
- Real adapters (mcp, http, local)
- Improved docs and guide
- Abstracted step actions
- External versions of:
  - event bus (in-memory, jsonl, sqlite, redis)
  - router
  - resource queue (in-memory, jsonl, sqlite, redis)
  - step runners / resource managers
- MCP / HTTP server wrapped engine
- Visual flow editor
- Observability through events
- MCP Auth flows
