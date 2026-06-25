# iOS native implementation

This directory will contain the Swift implementation of Nitro HybridObjects once Nitrogen codegen is run.

## Planned structure

```
ios/
└── HybridMapView.swift    # MapView HybridView implementation
```

## Getting started

1. Run `bun run nitrogen` from the repo root to generate native bindings.
2. Implement `HybridMapView` in Swift, extending the generated `HybridMapViewSpec`.
3. Wire up MapKit integration in a future phase.

See [src/native/README.md](../src/native/README.md) for the JS ↔ native architecture.
