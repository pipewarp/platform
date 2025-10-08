# @pipewarp/cli

Command line interface for running and validating pipewarp flows.

## Usage

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

## Commands

### run

`run <flowPath>`

#### options

- `-t, --test` run engine in test mode
- `-o, --out <outPath>` output json path, default is `output.json`
- `-s, --server <serverPath>` path to stdio mcp server, default is `./src/mcp-server.ts`

### validate

`validate <flowPath>`

### help

`--help` prints help message
