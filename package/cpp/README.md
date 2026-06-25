# C++ shared code

This directory will contain shared C++ code for cross-platform map logic once needed.

## Planned structure

```
cpp/
├── HybridMapView.hpp
└── HybridMapView.cpp
```

Nitrogen can generate C++ bindings alongside Swift and Kotlin. Use C++ for shared geometry calculations, tile caching, or other hot-path code that benefits from a single implementation.

See [src/native/README.md](../src/native/README.md) for the JS ↔ native architecture.
