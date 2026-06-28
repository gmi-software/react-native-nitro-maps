# Android native implementation

Kotlin implementation of the `MapView` Nitro HybridView backed by Google Maps.

## Structure

```
android/
├── build.gradle
├── CMakeLists.txt
└── src/main/java/com/margelo/nitro/nitromaps/
    ├── HybridMapView.kt              # Google Maps MapView implementation
    ├── NitroMapsPackage.kt           # React Native package registration
    ├── MapType+GoogleMap.kt          # MapType → GoogleMap.MAP_TYPE_* mapping
    ├── Camera+CameraPosition.kt      # Camera ↔ CameraPosition conversion
    ├── Region+LatLngBounds.kt        # Region ↔ LatLngBounds conversion
    └── GoogleMap+VisibleRegion.kt    # Projection → VisibleRegion conversion
```

Generated Nitrogen bindings live in `../nitrogen/generated/android/kotlin/` and are included via `NitroMaps+autolinking.gradle`.

## Google Maps API key

The library does not ship an API key. Host apps must provide one.

Expo apps can set the key with the package config plugin:

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-nitro-maps",
        {
          "androidGoogleMapsApiKey": "YOUR_API_KEY"
        }
      ]
    ]
  }
}
```

Non-Expo apps can add the key directly to `AndroidManifest.xml`:

```xml
<meta-data
  android:name="com.google.android.geo.API_KEY"
  android:value="YOUR_API_KEY" />
```

For the example Expo app, set `GOOGLE_MAPS_ANDROID_API_KEY` or the shared `GOOGLE_MAPS_API_KEY` fallback (see `example/.env.example`) before running `expo prebuild` or `expo run:android`.

`googleMapId` is supported for Google Cloud Map ID styling:

```tsx
<MapView provider="google" googleMapId="YOUR_MAP_ID" />
```

Expo apps can use the built-in config plugin instead of manual manifest edits — see [docs/expo-setup.md](../../docs/expo-setup.md).

## Getting started

1. Run `bun run nitrogen` from the repo root if you change the Nitro spec.
2. Build the example app: `GOOGLE_MAPS_ANDROID_API_KEY=your-key bun example android`.

See [src/native/README.md](../src/native/README.md) for the JS ↔ native architecture.
