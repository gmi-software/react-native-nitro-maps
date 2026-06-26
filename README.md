# react-native-nitro-maps

High-performance maps for React Native, built on [Nitro Modules](https://nitro.margelo.com) and the New Architecture.

> **Status: Work in Progress** — This library is in early development. The public API is defined but native map rendering is not yet implemented. Components render placeholders.

## Goals

- **Performance first** — Leverage Nitro Modules and JSI for zero-bridge map interactions.
- **New Architecture native** — Built exclusively for React Native's New Architecture (Fabric + TurboModules).
- **Cross-platform** — MapKit on iOS, Google Maps on Android, with a unified TypeScript API.
- **Developer experience** — Familiar component API inspired by `react-native-maps`, with full TypeScript support.
- **Tree-shakeable** — ESM-only build with proper `exports` map for optimal bundle size.

## Installation

```bash
bun add react-native-nitro-maps react-native-nitro-modules
```

> Requires React Native 0.78+ with the New Architecture enabled.

### Expo config plugin

For Expo apps (SDK 56+), add the config plugin to `app.json` or `app.config.js`:

```js
export default {
  expo: {
    plugins: [
      [
        'react-native-nitro-maps',
        {
          googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
          locationPermission:
            'Allow $(PRODUCT_NAME) to use your location for map features.',
        },
      ],
    ],
  },
};
```

| Option | Platform | Description |
| --- | --- | --- |
| `googleMapsApiKey` | Android | Injects `com.google.android.geo.API_KEY` meta-data. Reserved for future iOS Google Maps support ([#2](https://github.com/gmi-software/react-native-nitro-maps/issues/2)); no-op on iOS today (MapKit needs no key). |
| `locationPermission` | iOS + Android | String sets `NSLocationWhenInUseUsageDescription` and adds `ACCESS_FINE_LOCATION` + `ACCESS_COARSE_LOCATION`. Pass `false` or omit to skip. |
| `locationAlwaysPermission` | iOS + Android | String sets `NSLocationAlwaysAndWhenInUseUsageDescription` and adds `ACCESS_BACKGROUND_LOCATION`. Pass `false` or omit to skip. |

After `expo prebuild`, native projects have the required keys and permissions without manual edits.

> **Google Maps API key:** Use either this plugin's `googleMapsApiKey` option or Expo's built-in `android.config.googleMaps.apiKey` — pick one source, not both.

> **EAS Secrets:** Store `GOOGLE_MAPS_API_KEY` as an EAS secret and reference it via `process.env.GOOGLE_MAPS_API_KEY` in `app.config.js`.

See [docs/expo-setup.md](docs/expo-setup.md) for a full Expo SDK 56 setup walkthrough.

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

## Public API

### Components

| Component | Description |
| --- | --- |
| `MapView` | Root map container |
| `Marker` | Point annotation |
| `Polyline` | Line overlay |
| `Polygon` | Filled area overlay |
| `Circle` | Circular area overlay |

### Types

| Type | Description |
| --- | --- |
| `Coordinate` | `{ latitude, longitude }` |
| `Region` | Center + span |
| `Camera` | Position, zoom, heading, pitch |
| `MapType` | `'standard' \| 'satellite' \| 'hybrid' \| 'terrain'` |
| `MapViewRef` | Imperative handle for camera control |
| `MapViewProps` | Props for `MapView` |
| `MarkerProps` | Props for `Marker` |
| `PolylineProps` | Props for `Polyline` |
| `PolygonProps` | Props for `Polygon` |
| `CircleProps` | Props for `Circle` |

### Utilities

| Function | Description |
| --- | --- |
| `regionFromCoordinate(coord, latDelta?, lonDelta?)` | Create a `Region` from a coordinate |
| `distanceBetween(a, b)` | Haversine distance in meters |

## Roadmap

See [docs/roadmap.md](docs/roadmap.md) for the full development plan.

| Phase | Status | Description |
| --- | --- | --- |
| 1. Skeleton | In progress | Project structure, types, placeholder components |
| 2. Nitro View | Planned | Nitrogen codegen, native MapView HybridView |
| 3. MapKit (iOS) | Planned | Apple MapKit integration |
| 4. Google Maps (Android) | Planned | Google Maps SDK integration |
| 5. Overlays | Planned | Markers, polylines, polygons, circles |
| 6. Events & gestures | Planned | Press, long-press, region change |
| 7. Clustering | Planned | Marker clustering |
| 8. Polish & release | Planned | Performance, docs, v1.0 |

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
