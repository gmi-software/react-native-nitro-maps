# ADR 0003: Native overlay entering animations

## Status

Accepted

## Context

Markers and marker clusters are rendered from serialized overlay descriptors, not from React Native child views. Reanimated is a good fit for animating real React Native views, but making it the core path for descriptor-backed map overlays would add an optional ecosystem dependency to the package's default API without matching the current rendering model.

## Decision

Implement marker and marker-cluster entering animations as provider-owned native behavior configured through serializable TypeScript props. The core package does not require Reanimated for these animations; Reanimated integrations can be added later behind optional subpath exports when there is a view-backed animation surface.

## Consequences

- Marker and marker-cluster entering animations work for descriptor and bulk-marker APIs without requiring host apps to install Reanimated.
- Providers may keep native `system` defaults while explicit presets define the cross-provider contract.
- Future Reanimated support should be additive and optional, not a replacement for the native descriptor animation path.
