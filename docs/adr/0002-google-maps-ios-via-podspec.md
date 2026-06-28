# ADR 0002: Google Maps iOS via Podspec

## Status

Accepted

## Context

The iOS `google` provider compiles inside the `react-native-better-maps` CocoaPods target produced by React Native autolinking. Its Swift files import `GoogleMaps`, so the package target itself must declare and receive that dependency during `pod install`.

Google's iOS SDK documentation recommends Swift Package Manager for many app integrations, but adding Google Maps only to the host app with SPM would not satisfy the library pod target that compiles `GoogleMapProviderAdapter`.

## Decision

Declare `GoogleMaps` in `package/react-native-better-maps.podspec`.

Host apps still own runtime configuration by providing a Google Maps iOS API key in their app bundle. The example app reads `GOOGLE_MAPS_IOS_API_KEY` with `GOOGLE_MAPS_API_KEY` as a shared fallback, then writes `GoogleMapsIosApiKey` through the package config plugin.

## Consequences

- React Native consumers get the iOS Google Maps SDK through the normal CocoaPods install path.
- The library target can import `GoogleMaps` without host-app SPM coordination.
- Consumers that prefer SPM for the rest of their app still need CocoaPods for this React Native native module, matching the current Nitro/React Native autolinking flow.
