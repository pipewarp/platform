# pipewarp

### ⓘ Alpha Software

This software provides minimal functionality. Interfaces and behavior will evolve over time, expect breaking changes between versions.

## Overview

Pipewarp is a local first workflow engine designed to orchestrate MCP servers and other supporting AI resources. It focuses on realtime streaming in and out between tools, observability, flexibility in deployment, and scalability.

Currently it runs Zod defined JSON flows that describe ordered steps, routes success and failure paths, and creates results for later analysis.

## Quickstart

```bash
pnpm install
pnpm build
pnpm -F @pipewarp/cli start run examples/branching-flow-success.json -o output.json
```

This outputs the run context and step results of an example flow to `output.json`

See [app/cli/README.md](apps/cli/README.md) for more commmands.

## Concepts

| Term        | Meaning                                                            |
| ----------- | ------------------------------------------------------------------ |
| **Flow**    | JSON file with named steps that perform actions                    |
| **Step**    | A single action (MCP tool call, HTTP request, Flow Control, etc.). |
| **Outcome** | `success` or `failure` result that determines the next step        |
| **Export**  | Values a step explicitely exposes to other steps                   |

Today all steps call a thin MCP Server/Tool over **stdio** connection.
Future adapters will include step calls over HTTP and offer local actions.

## Packages

| Package                | Purpose                               |
| ---------------------- | ------------------------------------- |
| **@pipewarp/ports**    | Ports and their supporting types      |
| **@pipewarp/specs**    | Flow Specs and core types             |
| **@pipewarp/adapters** | Implementations of core ports.        |
| **@pipewarp/engine**   | Engine, flow loader, routing.         |
| **@pipewarp/cli**      | CLI for running and validating flows. |

## Roadmap

General list of planned features

- Per step explicit exports
- Real services (mcp, http, local)
- Improved docs and guides
- Abstracted step actions as bundled tools, operations, and profiles
- External versions of:
  - [ x ] event bus in-memory - with jsonl, sqlite, redis later
  - router
  - resource queue (in-memory, jsonl, sqlite, redis)
  - step runners / workers
- Single process vs multiple process deployments
- Visual flow editor
- Observability through events
- MCP Auth flows
- JSON Schema defined flow specs

## Architecture

Currently aiming for a flexible event based architecture. These decisions are ongoing and
constantly under scrutiny and revision.

### Factors that influence architecture decisions often include:

- Clear separation of concerns and responsibilities
- Scalability
- Flexibility

### Architecture Goals

#### Flexibility in deployment

- Easy one process install option with all services running in process with appropriate levels of persistance.
- Ability to use out of process components for portions of the system based on upon user needs.
- Advanced setups may offer flexibility to run components externally as services in remote locations.

#### Scalability

- Services should be able to scale horizontally for use cases which require it.
- Consistent ports, contracts to have clear boundaries

## Stack

Currently: node, Typescript, pnpm, Turborepo, vitest.

Possible additions: python + uv + venv (for mcp servers), docker, redis
