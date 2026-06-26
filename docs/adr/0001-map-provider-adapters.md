# Map provider adapters own native SDK views

`MapView` supports multiple native rendering backends through provider adapters. The Nitro `HybridMapView` remains a stable host/container, while each provider adapter owns its native SDK view, lifecycle, camera operations, overlays, events, and cleanup. Changing `provider` remounts the native view from React instead of mutating an existing SDK view, which keeps Android `MapView` lifecycle and iOS MapKit state predictable.
