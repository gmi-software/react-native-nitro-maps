# Architecture

## Overview

`react-native-nitro-maps` is a React Native maps library built on [Nitro Modules](https://nitro.margelo.com) and the New Architecture. It provides a familiar component-based API while leveraging JSI for high-performance native communication.

## Layer diagram

```
┌─────────────────────────────────────────────────┐
│  Public API (TypeScript / React)                │
│  MapView, Marker, Polyline, Polygon, Circle    │
│  Types: Coordinate, Region, Camera, MapViewRef  │
├─────────────────────────────────────────────────┤
│  Nitro Layer                                    │
│  MapView.nitro.ts (HybridView spec)             │
│  nitro.json (autolinking)                       │
│  nitrogen/generated/ (codegen output)             │
├─────────────────────────────────────────────────┤
│  Native Implementation                          │
│  HybridMapView host → provider adapter          │
│  iOS: AppleMapProviderAdapter → MapKit          │
│       GoogleMapProviderAdapter → Google SDK     │
│  Android: GoogleMapProviderAdapter → Google SDK  │
│  C++: shared geometry / tile logic (optional)   │
└─────────────────────────────────────────────────┘
```

## Monorepo structure

```
react-native-nitro-maps/
├── package/          # Library package (react-native-nitro-maps)
│   ├── src/          # TypeScript source
│   ├── ios/          # Swift native code
│   ├── android/      # Kotlin native code
│   ├── cpp/          # Shared C++ code
│   └── nitro.json    # Nitrogen autolinking config
├── example/          # Expo example app
├── docs/             # Documentation
└── .github/          # CI workflows
```

## Component model

### MapView

The root component, backed by a Nitro `HybridMapView` host. The host owns a stable container view and delegates map behavior to a provider adapter selected before the native SDK map view is created.

Provider defaults are resolved in the React wrapper:

| Platform | Default provider | Current adapter                                      |
| -------- | ---------------- | ---------------------------------------------------- |
| iOS      | `apple`          | `AppleMapProviderAdapter` backed by MapKit           |
| Android  | `google`         | `GoogleMapProviderAdapter` backed by Google Maps SDK |

The iOS host also supports the explicit `google` provider through `GoogleMapProviderAdapter`. Unsupported explicit providers fail early in JS. Native hosts also reject unsupported providers if one reaches native code unexpectedly. Changing `provider` or `googleMapId` remounts the native view instead of recreating SDK views in place.

### Provider adapters

Provider adapters own SDK-specific view creation, destruction, lifecycle, camera operations, visible-region calculations, map type, gestures, controls, user location, overlays, press events, clustering, and custom styles. `HybridMapView` stores Nitro props and callbacks, installs the selected adapter, and replays the current state into that adapter.

### Events

Map and overlay callbacks are wired through Nitro listeners on the HybridView. Callbacks receive payloads directly (e.g. `onPress(coordinate)`, `onRegionChange(region)`).

| Callback                                    | Payload                  | Notes                                                                                                                                                                                              |
| ------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onRegionChange` / `onRegionChangeComplete` | `Region`                 | iOS uses `MKCoordinateRegion` (center + span); Android derives center + deltas from visible `LatLngBounds`. Values agree without rotation/pitch but may diverge when the map is tilted or rotated. |
| `onPress` / `onLongPress`                   | `Coordinate`             | Map background only; marker taps do not also fire map `onPress`.                                                                                                                                   |
| `onMapReady`                                | none                     | Fires once after the map finishes loading tiles.                                                                                                                                                   |
| `Marker.onPress` / `onDragEnd`              | none / `Coordinate`      | Dispatched by overlay `id` from native to JS registry.                                                                                                                                             |
| Overlay `onPress`                           | none                     | Polyline/polygon/circle with `onPress` default to `tappable` on native.                                                                                                                            |
| `onClusterPress`                            | `string[]`, `Coordinate` | Fires when a marker cluster is tapped; IDs are member marker overlay ids.                                                                                                                          |

### Advanced MapView props

| Prop / method | Notes |
| --- | --- |
| `provider` | Optional map rendering backend. Defaults to `apple` on iOS and `google` on Android. Explicit unsupported providers throw. |
| `googleMapId` | Google Cloud Map ID for the `google` provider. It is creation-time SDK configuration, so changing it remounts the native map view. |
| `clusteringEnabled` | Custom grid-based clustering via `MarkerClusterEngine` on both platforms (viewport-aware, background compute). |
| `Marker.clusterable` | Opt-out per marker (defaults to `true`). Non-clusterable markers always render individually. |
| `customMapStyle` | JSON string. The `google` provider uses Google Maps JSON styles on iOS and Android. The `apple` provider maps a curated subset to `MKMapConfiguration` on iOS 16+. |
| `showsUserLocation` / `followsUserLocation` | Toggles the native user-location layer. Host app must request location permission (`NSLocationWhenInUseUsageDescription` on iOS; `ACCESS_FINE_LOCATION` on Android). |
| `showsCompass` / `showsScale` | Compass on both platforms. Scale is iOS-only (`showsScale` is a no-op on Android). |
| `mapPadding` | Edge insets in density-independent pixels. Applied via `layoutMargins` (iOS) or `setPadding` (Android). |
| `fitToCoordinates(coords, padding?, animated?)` | Imperative ref method; fits camera to a set of coordinates with optional padding. |

### Platform gaps (Phase 8)

- **Provider availability** — `apple` and `google` are implemented on iOS, and `google` is implemented on Android. `openstreetmap` and `mapbox` are planned provider adapters.
- **Custom styles on Apple MapKit** — no full Google Maps JSON parity; only a curated subset is mapped to MapKit configuration.
- **Scale control on Google Maps** — Google Maps SDK has no native scale bar; `showsScale` is rejected for the `google` provider.
- **User location** — the library toggles the layer only; permission prompts and manifest/Info.plist entries are the host app's responsibility.
- **`followsUserLocation` on Android** — enables the location layer when permitted; continuous camera follow is not built into Google Maps and may require host-app camera updates.

### Overlay components

`Marker`, `Polyline`, `Polygon`, and `Circle` are overlay components that compose inside `MapView`. Overlay props are collected on the JS side and serialized into descriptor structs passed to the native `HybridMapView` (data-driven architecture).

## Data flow (target state)

```
User interaction
    ↓
React component tree (<MapView><Marker /></MapView>)
    ↓
MapView collects overlay descriptors + props
    ↓
Nitro HybridView (JSI, zero-copy structs)
    ↓
Native HybridMapView (Swift / Kotlin)
    ↓
Platform map SDK renders
    ↓
Events flow back via Nitro listeners
    ↓
React callbacks (onPress, onRegionChange, etc.)
```

## Build pipeline

- **Source**: TypeScript in `package/src/`
- **Build**: `react-native-builder-bob` (ESM-only, `module` + `typescript` targets)
- **Metro**: Resolves `source` export condition for development
- **Codegen**: Nitrogen reads `*.nitro.ts` specs and generates native bindings

## Technology choices

| Decision           | Choice                   | Rationale                              |
| ------------------ | ------------------------ | -------------------------------------- |
| Native bridge      | Nitro Modules            | JSI-based, type-safe, codegen          |
| Architecture       | New Architecture only    | Required by Nitro Views                |
| Build tool         | react-native-builder-bob | RN community standard                  |
| Package manager    | Bun workspaces           | Fast, modern                           |
| Module format      | ESM-only                 | Avoids dual-package hazard             |
| Example app        | Expo SDK 56              | New Arch mandatory, good DX            |
| iOS default maps   | MapKit                   | Native, no API key needed              |
| Google maps        | Google Maps SDK          | Shared provider on iOS and Android     |
| Provider switching | React remount            | Keeps native SDK lifecycle predictable |
