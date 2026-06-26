# Expo setup (SDK 56+)

This guide covers configuring `react-native-nitro-maps` in an Expo app with the New Architecture enabled.

## Prerequisites

- Expo SDK 56+
- React Native 0.78+ with New Architecture enabled (`newArchEnabled: true` in `app.json`)
- `react-native-nitro-modules` installed alongside `react-native-nitro-maps`

## Install

```bash
bun add react-native-nitro-maps react-native-nitro-modules
```

## Config plugin

Add the plugin to `app.json` or `app.config.js`:

```js
/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    // ...your existing config
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

### Plugin options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `googleMapsApiKey` | `string` | — | Android: injects `com.google.android.geo.API_KEY` meta-data. iOS: no-op (MapKit needs no key; reserved for future Google Maps iOS support in [#2](https://github.com/gmi-software/react-native-nitro-maps/issues/2)). |
| `locationPermission` | `string \| false` | — | When set to a string: iOS `NSLocationWhenInUseUsageDescription` + Android `ACCESS_FINE_LOCATION` and `ACCESS_COARSE_LOCATION`. |
| `locationAlwaysPermission` | `string \| false` | — | When set to a string: iOS `NSLocationAlwaysAndWhenInUseUsageDescription` + Android `ACCESS_BACKGROUND_LOCATION`. |

Omitting `googleMapsApiKey` does not fail prebuild. Android maps will not render until a key is provided (via the plugin or manually). iOS MapKit works without a key.

## Google Maps API key

### Local development

Create a `.env` file (see `example/.env.example`):

```
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

Load it in `app.config.js` with `process.env.GOOGLE_MAPS_API_KEY` as shown above.

### EAS Build

Store the key as an EAS secret:

```bash
eas secret:create --name GOOGLE_MAPS_API_KEY --value your-google-maps-api-key
```

Reference it in `app.config.js` via `process.env.GOOGLE_MAPS_API_KEY`. EAS injects secrets into the build environment automatically.

### Alternative: Expo built-in Google Maps config

You can use Expo's native `android.config.googleMaps.apiKey` instead of the plugin's `googleMapsApiKey`. Pick one source — do not configure both.

## Prebuild

Generate native projects:

```bash
expo prebuild --clean
```

The plugin injects:

- **Android:** `com.google.android.geo.API_KEY` meta-data (when `googleMapsApiKey` is set) and location permissions (when location options are set)
- **iOS:** location usage description strings (when location options are set)

## Run

```bash
expo run:android
expo run:ios
```

## Example app

The monorepo example at `example/` uses this plugin. From the repo root:

```bash
GOOGLE_MAPS_API_KEY=your-key bun example prebuild
GOOGLE_MAPS_API_KEY=your-key bun example android
```

The example's `prebuild` script builds the plugin (`build:plugin`) before running `expo prebuild`, since the workspace symlink requires compiled plugin output.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Blank map on Android | Ensure `googleMapsApiKey` is set and `expo prebuild` was run after adding the plugin. |
| Location dot not showing | Set `locationPermission` in the plugin options and re-run prebuild. |
| Plugin not found | Confirm `react-native-nitro-maps` is installed and listed in `plugins`. |
| `Cannot find module './plugin/build/index'` | Run `bun run build:plugin` in the package (or `bun run build` from the repo root) before prebuild when using a workspace link. |
