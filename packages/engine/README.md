# @pipewarp/engine

The main engine that runs flow definitions.

Currently its a huge class with queues, some events, mcp registry, and step runners.

It is purposely too large in order to prove concepts, which can be abstracted out later.

In `v0.1.0-alpha.1` of this package and others, the engine refactored an event
bus outside of it, and now responds to a couple events to initiate flows and steps.

This package is moving towards an event based i/o surface with external supporting services.
