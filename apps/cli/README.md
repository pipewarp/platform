# @pipewarp/cli

Command line interface for running and validating pipewarp flows.

May expand later to a general application layer to manage pipewarp processes as an alternative to a future gui.

## Usage

### run a flow

```bash
pnpm -F @pipewarp/cli start run <flow.json>
```

or in `apps/cli` directory:

```bash
pnpm start run <flow.json>
```

You can also link to the built cli and run it directly:

```bash
# from `apps/cli` folder
pnpm link --global
pwp --help

# or run
pwp run <flow.json>
```

### validate a flow definition

```bash
# from project root
pnpm -F @pipewarp/cli start validate <flow.json>

# after linked globally
pwp validate <flow.json>
```

### run a streaming demo demo

```bash
# from project root
pnpm -F @pipewarp/cli start run examples/art-stream.flow.json -d
```

## Commands

### run

`run <flowPath>`

#### options

- `-t, --test` run engine in test mode
- `-o, --out <outPath>` output json path, default is `output.temp.json`
- `-s, --server <serverPath>` path to stdio mcp server, default is `./src/mcp-server.ts`
- `-d, --demo` run in specific demo mode with supplied localhost MCP servers spawned as child processes.

### validate

`validate <flowPath>` validates a flow definition file.

### help

`--help` prints help message
