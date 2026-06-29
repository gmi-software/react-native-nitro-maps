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
| `googleMapsApiKey` | iOS + Android | Shared fallback when platform-specific keys are omitted. |
| `iosGoogleMapsApiKey` | iOS | Injects `GoogleMapsIosApiKey` into Info.plist for `provider="google"`. |
| `androidGoogleMapsApiKey` | Android | Injects `com.google.android.geo.API_KEY` meta-data. |
| `locationPermission` | iOS + Android | String sets `NSLocationWhenInUseUsageDescription` and adds `ACCESS_FINE_LOCATION` + `ACCESS_COARSE_LOCATION`. Pass `false` or omit to skip. |
| `locationAlwaysPermission` | iOS + Android | String sets `NSLocationAlwaysAndWhenInUseUsageDescription` and adds `ACCESS_BACKGROUND_LOCATION`. Pass `false` or omit to skip. |

After `expo prebuild`, native projects have the required keys and permissions without manual edits.

> **Google Maps API key:** Use either this plugin's `googleMapsApiKey` option or Expo's built-in `android.config.googleMaps.apiKey` — pick one source, not both.
>
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
        image={require('./assets/pin.png')}
        anchor={{ x: 0.5, y: 1 }}
        rotation={45}
        flat
        opacity={0.9}
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

### Custom marker images

Markers support custom bitmap icons with positioning and styling options:

```tsx
<Marker
  coordinate={coord}
  image={require('./pin.png')}
  anchor={{ x: 0.5, y: 1.0 }}
  rotation={45}
  flat
  opacity={0.9}
/>

<MapView
  markers={[
    {
      id: '1',
      coordinate: coord,
      image: { uri: 'https://example.com/pin.png' },
      anchor: { x: 0.5, y: 1 },
    },
  ]}
/>
```

Supported image sources:

| Source            | Example                         | Notes                                      |
| ----------------- | ------------------------------- | ------------------------------------------ |
| Bundled asset     | `require('./pin.png')`          | Resolved on JS side before crossing Nitro  |
| Local URI         | `{ uri: 'file:///…' }`          | Platform file paths                        |
| Remote URL        | `{ uri: 'https://…' }`          | Async fetch with in-memory cache           |

Additional props:

| Prop           | Default        | Description                                           |
| -------------- | -------------- | ----------------------------------------------------- |
| `anchor`       | `{ x: 0.5, y: 1 }` | Point on the image aligned to the coordinate    |
| `centerOffset` | —              | Extra offset in dp (MapKit-style)                     |
| `rotation`     | `0`            | Clockwise rotation in degrees                         |
| `flat`         | `false`        | Rotate with map plane (Google Maps; limited on iOS)   |
| `opacity`      | `1`            | Marker opacity from 0 to 1                            |

Platform notes:

- Recommended icon size: up to **128×128 dp**; larger bitmaps are downscaled when `width`/`height` are provided.
- Retina assets: pass `require()` and let Metro resolve `@2x`/`@3x`; optional explicit `width`/`height`/`scale` on `MarkerImage`.
- Remote URLs use a basic in-memory cache only (no disk persistence).
- Custom React Native marker views (`<Marker><View /></Marker>`) are not supported.

### react-native-maps migration (markers)

| react-native-maps      | react-native-nitro-maps              |
| ---------------------- | -------------------------------------- |
| `image={require(...)}` | `image={require(...)}`                 |
| `anchor={{ x, y }}`    | `anchor={{ x, y }}`                    |
| `centerOffset`         | `centerOffset`                         |
| `rotation`             | `rotation`                             |
| `flat`                 | `flat`                                 |
| `opacity`              | `opacity`                              |
| Custom RN child views  | Not supported (use bitmap `image`)     |

#### Google Maps setup

Host apps must provide platform API keys for the Google Maps SDK:

- Expo: add the config plugin to your app config:

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-nitro-maps",
        {
          "googleMapsApiKey": "YOUR_KEY_HERE"
        }
      ]
    ]
  }
}
```

Use `iosGoogleMapsApiKey` and `androidGoogleMapsApiKey` instead when each platform needs a different restricted key.

- iOS: add a `GoogleMapsIosApiKey` string to `Info.plist`.
- Android: add `com.google.android.geo.API_KEY` metadata to `AndroidManifest.xml`.

The example app uses the config plugin. It reads `GOOGLE_MAPS_IOS_API_KEY` and `GOOGLE_MAPS_ANDROID_API_KEY` with `GOOGLE_MAPS_API_KEY` as a shared fallback.

The `google` provider also accepts `googleMapId` for Google Cloud Map ID styling:

```tsx
<MapView provider="google" googleMapId="YOUR_MAP_ID" style={{ flex: 1 }} />
```

`googleMapId` is creation-time configuration for native SDK views. Changing it remounts the native map view, matching provider changes.

### Marker entering animations

`MapView` can configure native entering animations for markers and marker clusters:

```tsx
<MapView
  style={{ flex: 1 }}
  clusteringEnabled
  markerEnteringAnimation={{ preset: 'fade-scale', duration: 180 }}
  clusterEnteringAnimation={{ preset: 'fade' }}
>
  <Marker
    coordinate={{ latitude: 52.2297, longitude: 21.0122 }}
    enteringAnimation={false}
  />
</MapView>
```

`markerEnteringAnimation` is the map-level default for all markers, including bulk `markers` descriptors. `Marker.enteringAnimation` and bulk marker `enteringAnimation` override that default for one marker; `false` is an explicit opt-out. `clusterEnteringAnimation` applies to marker clusters when clustering is enabled.

When no animation prop is set, the default is `system`: each provider keeps its native entering behavior. Explicit presets (`fade`, `fade-scale`) are the cross-provider contract. `fade-scale` may gracefully fall back to `fade` on SDK marker surfaces that do not support efficient scaling.

Explicit configs use milliseconds. `duration` defaults to `180`, `delay` defaults to `0`, and both values are clamped to `0..3000` before they reach the native provider. `reduceMotion` defaults to `system`, which disables explicit animations when the platform Reduced Motion setting asks for it; use `never` only when the app intentionally ignores that setting for this overlay.

On Google Maps providers, marker and cluster entering animations can reduce UI-thread frame rate when a large viewport refresh adds many markers at once. The provider caps animated markers per refresh and may show the remaining markers immediately to preserve map gesture performance. For very large marker sets, prefer clustering, shorter durations, or `markerEnteringAnimation={false}` / `clusterEnteringAnimation={false}` when smooth gestures are more important than entrance motion.

### Capability matrix

| Capability                 | `apple` iOS                                                 | `google` iOS                               | `google` Android                           | Future providers     |
| -------------------------- | ----------------------------------------------------------- | ------------------------------------------ | ------------------------------------------ | -------------------- |
| Region / camera            | Supported                                                   | Supported                                  | Supported                                  | Planned              |
| Camera animation           | Supported                                                   | Supported                                  | Supported                                  | Planned              |
| Visible region             | Supported                                                   | Supported                                  | Supported                                  | Planned              |
| Fit to coordinates         | Supported                                                   | Supported                                  | Supported                                  | Planned              |
| Map types                  | Standard, satellite, hybrid; terrain falls back to standard | Standard, satellite, hybrid, terrain       | Standard, satellite, hybrid, terrain       | Planned              |
| Gestures                   | Supported                                                   | Supported                                  | Supported                                  | Planned              |
| User location              | Supported; host app owns permission prompt                  | Supported; host app owns permission prompt | Supported; host app owns permission prompt | Planned              |
| Compass                    | Supported                                                   | Supported                                  | Supported                                  | Planned              |
| Scale control              | Supported                                                   | Unsupported                                | Unsupported                                | Planned per provider |
| Markers / overlays         | Supported                                                   | Supported                                  | Supported                                  | Planned              |
| Custom marker images       | Supported                                                   | Supported                                  | Supported                                  | Planned              |
| Overlay press events       | Supported                                                   | Supported                                  | Supported                                  | Planned              |
| Marker entering animation  | System + `fade`, `fade-scale`                               | System + `fade`; scale fallback            | System + `fade`; scale fallback            | Planned per provider |
| Cluster entering animation | System + `fade`, `fade-scale`                               | System + `fade`; scale fallback            | System + `fade`; scale fallback            | Planned per provider |
| Clustering                 | Supported                                                   | Supported                                  | Supported                                  | Planned per provider |
| Custom styles              | Curated subset on iOS 16+                                   | Google Maps JSON styles                    | Google Maps JSON styles                    | Planned per provider |
| Google Map ID              | Unsupported                                                 | Supported                                  | Supported                                  | Planned per provider |

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
| `MarkerDescriptor`        | Bulk marker descriptor                               |
| `MarkerProps`             | Props for `Marker`                                   |
| `MarkerImage`             | Resolved marker image descriptor                     |
| `MarkerAnchor`            | Anchor point on marker image (0..1)                  |
| `MarkerPoint`             | Point offset in dp                                   |
| `OverlayEnteringAnimation` | Marker / marker-cluster entering animation config   |
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
- Markers with callouts, drag support, and custom bitmap images
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
