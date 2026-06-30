# React Native Nitro Maps

Shared language for the map rendering domain in `react-native-better-maps`.

## Language

**Map Provider**:
A native rendering backend for the map view, such as Apple MapKit, Google Maps SDK, Mapbox SDK, or an OpenStreetMap-backed renderer.
_Avoid_: Tile source, geocoding provider

**Google Map ID**:
A Google Cloud Map ID used by the Google Maps SDK to apply cloud-based map styling. It is supported only by the `google` map provider and is distinct from the Google Maps API key required to load the SDK.
_Avoid_: API key, style JSON

**Marker**:
A point annotation created and owned by the app at a geographic coordinate on the map.
_Avoid_: Pin

**Point of Interest (POI)**:
A provider-owned map feature rendered by the base map, such as a business, park, school, or public place. It is not a `Marker` because the app does not create, own, or update it as an overlay.
_Avoid_: Marker, app marker, custom marker

**Native POI Detail Presentation**:
A provider-owned native UI surface that presents details for a selected point of interest.
_Avoid_: React Native callout, custom POI card

**Marker Cluster**:
A grouped marker representation shown when nearby clusterable markers collapse into one map annotation.
_Avoid_: Cluster pin, marker group

**Entering Animation**:
The visual transition used when a marker or marker cluster first appears on the map.
_Avoid_: Appear animation, spawn animation
