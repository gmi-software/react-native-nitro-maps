# React Native Nitro Maps

Shared language for the map rendering domain in `react-native-nitro-maps`.

## Language

**Map Provider**:
A native rendering backend for the map view, such as Apple MapKit, Google Maps SDK, Mapbox SDK, or an OpenStreetMap-backed renderer.
_Avoid_: Tile source, geocoding provider

**Google Map ID**:
A Google Cloud Map ID used by the Google Maps SDK to apply cloud-based map styling. It is supported only by the `google` map provider and is distinct from the Google Maps API key required to load the SDK.
_Avoid_: API key, style JSON
