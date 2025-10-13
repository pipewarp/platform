# @pipewarp/adapters

Adapter implementations of ports.

Implements:

- flow store
- mcp manager
- event bus

The archictecture of the code is evolving quickly and these adapters will change.

## Event Bus

### In Memory

Simple in memory event bus uses EventEmitter node class to emit and handle
events.

Only a couple event kind strings are currently supported:

- `step.queued`
- `flow.queued`

See [/packages/ports/src/events/events.ts](/packages/ports/src/events/events.ts) for zod sceheme definitions for these event kinds.

The engine listens to `flows.lifescycle` and `steps.lifecycle` event but topics for
these event types.

Plan to support Redis or other external bus systems in the future.
