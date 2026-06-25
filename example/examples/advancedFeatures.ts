import type { MapScenario } from './types';

const KRAKOW_CENTER = {
  latitude: 50.0614,
  longitude: 19.9366,
};

/** Generates a grid of markers around Kraków for clustering demos. */
function generateClusterMarkers(
  count: number,
  spread: number,
): MapScenario['markers'] {
  const markers: NonNullable<MapScenario['markers']> = [];
  const side = Math.ceil(Math.sqrt(count));

  for (let index = 0; index < count; index += 1) {
    const row = Math.floor(index / side);
    const col = index % side;
    const latOffset = (row - side / 2) * spread;
    const lngOffset = (col - side / 2) * spread;

    markers.push({
      id: `cluster-${index}`,
      coordinate: {
        latitude: KRAKOW_CENTER.latitude + latOffset,
        longitude: KRAKOW_CENTER.longitude + lngOffset,
      },
      title: `Point ${index + 1}`,
      clusterable: true,
    });
  }

  return markers;
}

/** Minimal dark style JSON (hides POIs) for custom map style demos. */
export const POI_HIDDEN_MAP_STYLE = JSON.stringify([
  {
    featureType: 'poi',
    elementType: 'all',
    stylers: [{ visibility: 'off' }],
  },
]);

export const advancedFeaturesScenario: MapScenario = {
  id: 'advanced-features',
  name: 'Advanced features',
  description:
    'Clustering, compass/scale, map padding, and fit-to-coordinates demo',
  region: {
    latitude: KRAKOW_CENTER.latitude,
    longitude: KRAKOW_CENTER.longitude,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  },
  markers: generateClusterMarkers(24, 0.008),
  advanced: {
    clusteringEnabled: true,
    showsCompass: true,
    showsScale: true,
    mapPadding: { top: 48, right: 16, bottom: 160, left: 16 },
    customMapStyle: POI_HIDDEN_MAP_STYLE,
    fitToCoordinatesOnReady: true,
  },
};
