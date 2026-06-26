# react-native-nitro-maps

High-performance maps for React Native, built on [Nitro Modules](https://nitro.margelo.com) and the New Architecture.

> **Status: Work in Progress** — Native rendering exists for Apple MapKit on iOS and Google Maps SDK on iOS and Android. Additional providers are planned.

## Goals

- **Performance first** — Leverage Nitro Modules and JSI for zero-bridge map interactions.
- **New Architecture native** — Built exclusively for React Native's New Architecture (Fabric + TurboModules).
- **Cross-platform** — Apple MapKit on iOS and Google Maps SDK on Android by default, with a unified TypeScript API.
- **Developer experience** — Familiar component API inspired by `react-native-maps`, with full TypeScript support.
- **Tree-shakeable** — ESM-only build with proper `exports` map for optimal bundle size.

## Installation

```bash
bun add react-native-nitro-maps react-native-nitro-modules
```

> Requires React Native 0.78+ with the New Architecture enabled.

## Usage

```tsx
import { MapView, Marker, Polyline } from 'react-native-nitro-maps';

function MyMap() {
  return (
    <MapView
      style={{ flex: 1 }}
      mapType="standard"
      onRegionChangeComplete={(region) => console.log(region)}
    >
      <Marker
        coordinate={{ latitude: 52.2297, longitude: 21.0122 }}
        title="Warsaw"
      />
      <Polyline
        coordinates={[
          { latitude: 52.2297, longitude: 21.0122 },
          { latitude: 52.237, longitude: 21.017 },
        ]}
        strokeColor="#FF0000"
        strokeWidth={3}
      />
    </MapView>
  );
}
```

### Imperative API

```tsx
import { useRef } from 'react';
import { MapView, type MapViewRef } from 'react-native-nitro-maps';

function ControlledMap() {
  const mapRef = useRef<MapViewRef>(null);

  const flyToWarsaw = () => {
    mapRef.current?.animateCamera({
      center: { latitude: 52.2297, longitude: 21.0122 },
      zoom: 12,
    });
  };

  return <MapView ref={mapRef} style={{ flex: 1 }} />;
}
```

### Map providers

`MapView` accepts an optional `provider` prop:

```tsx
import { Platform } from 'react-native';
import { MapView, type MapProvider } from 'react-native-nitro-maps';

const provider: MapProvider = Platform.OS === 'android' ? 'google' : 'apple';

export function ProviderMap() {
  return <MapView provider={provider} style={{ flex: 1 }} />;
}
```

When `provider` is omitted, defaults stay backward-compatible:

| Platform | Default provider |
| -------- | ---------------- |
| iOS      | `apple`          |
| Android  | `google`         |

Current provider availability:

| Provider        | iOS       | Android     | Notes                           |
| --------------- | --------- | ----------- | ------------------------------- |
| `apple`         | Supported | Unsupported | Apple MapKit                    |
| `google`        | Supported | Supported   | Google Maps SDK                 |
| `openstreetmap` | Planned   | Planned     | No rendering implementation yet |
| `mapbox`        | Planned   | Planned     | No rendering implementation yet |

Unsupported explicit providers throw before a native map view is created. Changing `provider` remounts the native map view, so controlled props such as `region`, `camera`, overlays, and callbacks should be supplied again through React props.

Provider-specific TypeScript props are exposed through `MapViewPropsForProvider<P>`. For example, `showsScale` is accepted for `apple` but rejected for `google` because Google Maps SDK has no native scale control.

#### Google Maps setup

Host apps must provide platform API keys for the Google Maps SDK:

- iOS: add a `GoogleMapsIosApiKey` string to `Info.plist`.
- Android: add `com.google.android.geo.API_KEY` metadata to `AndroidManifest.xml`.

The example app reads `GOOGLE_MAPS_IOS_API_KEY` and `GOOGLE_MAPS_ANDROID_API_KEY` from the environment. `GOOGLE_MAPS_API_KEY` remains accepted as an Android fallback for older local setups.

The `google` provider also accepts `googleMapId` for Google Cloud Map ID styling:

```tsx
<MapView provider="google" googleMapId="YOUR_MAP_ID" style={{ flex: 1 }} />
```

`googleMapId` is creation-time configuration for native SDK views. Changing it remounts the native map view, matching provider changes.

### Capability matrix

| Capability           | `apple` iOS                                                 | `google` iOS                               | `google` Android                           | Future providers     |
| -------------------- | ----------------------------------------------------------- | ------------------------------------------ | ------------------------------------------ | -------------------- |
| Region / camera      | Supported                                                   | Supported                                  | Supported                                  | Planned              |
| Camera animation     | Supported                                                   | Supported                                  | Supported                                  | Planned              |
| Visible region       | Supported                                                   | Supported                                  | Supported                                  | Planned              |
| Fit to coordinates   | Supported                                                   | Supported                                  | Supported                                  | Planned              |
| Map types            | Standard, satellite, hybrid; terrain falls back to standard | Standard, satellite, hybrid, terrain       | Standard, satellite, hybrid, terrain       | Planned              |
| Gestures             | Supported                                                   | Supported                                  | Supported                                  | Planned              |
| User location        | Supported; host app owns permission prompt                  | Supported; host app owns permission prompt | Supported; host app owns permission prompt | Planned              |
| Compass              | Supported                                                   | Supported                                  | Supported                                  | Planned              |
| Scale control        | Supported                                                   | Unsupported                                | Unsupported                                | Planned per provider |
| Markers / overlays   | Supported                                                   | Supported                                  | Supported                                  | Planned              |
| Overlay press events | Supported                                                   | Supported                                  | Supported                                  | Planned              |
| Clustering           | Supported                                                   | Supported                                  | Supported                                  | Planned per provider |
| Custom styles        | Curated subset on iOS 16+                                   | Google Maps JSON styles                    | Google Maps JSON styles                    | Planned per provider |
| Google Map ID        | Unsupported                                                 | Supported                                  | Supported                                  | Planned per provider |

## Public API

### Components

| Component  | Description           |
| ---------- | --------------------- |
| `MapView`  | Root map container    |
| `Marker`   | Point annotation      |
| `Polyline` | Line overlay          |
| `Polygon`  | Filled area overlay   |
| `Circle`   | Circular area overlay |

### Types

| Type                      | Description                                          |
| ------------------------- | ---------------------------------------------------- |
| `Coordinate`              | `{ latitude, longitude }`                            |
| `Region`                  | Center + span                                        |
| `Camera`                  | Position, zoom, heading, pitch                       |
| `MapType`                 | `'standard' \| 'satellite' \| 'hybrid' \| 'terrain'` |
| `MapProvider`             | `'apple' \| 'google' \| 'openstreetmap' \| 'mapbox'` |
| `MapViewRef`              | Imperative handle for camera control                 |
| `MapViewProps`            | Props for `MapView`                                  |
| `MapViewPropsForProvider` | Provider-specific `MapView` props                    |
| `MarkerProps`             | Props for `Marker`                                   |
| `PolylineProps`           | Props for `Polyline`                                 |
| `PolygonProps`            | Props for `Polygon`                                  |
| `CircleProps`             | Props for `Circle`                                   |

### Utilities

| Function                                            | Description                         |
| --------------------------------------------------- | ----------------------------------- |
| `regionFromCoordinate(coord, latDelta?, lonDelta?)` | Create a `Region` from a coordinate |
| `distanceBetween(a, b)`                             | Haversine distance in meters        |

## Roadmap

See [docs/roadmap.md](docs/roadmap.md) for the full development plan.

| Phase                    | Status      | Description                                      |
| ------------------------ | ----------- | ------------------------------------------------ |
| 1. Skeleton              | In progress | Project structure, types, placeholder components |
| 2. Nitro View            | Planned     | Nitrogen codegen, native MapView HybridView      |
| 3. MapKit (iOS)          | Planned     | Apple MapKit integration                         |
| 4. Google Maps (Android) | Planned     | Google Maps SDK integration                      |
| 5. Overlays              | Planned     | Markers, polylines, polygons, circles            |
| 6. Events & gestures     | Planned     | Press, long-press, region change                 |
| 7. Clustering            | Planned     | Marker clustering                                |
| 8. Polish & release      | Planned     | Performance, docs, v1.0                          |

## Planned features

- MapKit and Google Maps rendering
- Markers with callouts and drag support
- Polylines, polygons, and circles
- Camera animations and imperative control
- Region and press event callbacks
- Marker clustering
- Custom map styles
- Offline tile caching (future)

## Development

```bash
# Install dependencies
bun install

# Build the library
bun run build

# Run linting and type checks
bun run lint
bun run typecheck

# Start the example app
bun run example start
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## Architecture

See [docs/architecture.md](docs/architecture.md) for the technical architecture overview.

## License

MIT — see [LICENSE](LICENSE).
