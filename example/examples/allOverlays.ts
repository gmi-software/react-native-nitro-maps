import type { MapScenario } from './types';

/** Combined demo showing every overlay type on one map. */
export const allOverlaysScenario: MapScenario = {
  id: 'all-overlays',
  name: 'All overlays',
  description: 'Marker, polyline, polygon & circle',
  region: {
    latitude: 52.2297,
    longitude: 21.0122,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  },
  markers: [
    {
      id: 'warsaw-marker',
      coordinate: { latitude: 52.2297, longitude: 21.0122 },
      title: 'Warsaw',
      subtitle: 'Capital of Poland',
      draggable: true,
    },
  ],
  polylines: [
    {
      id: 'route',
      coordinates: [
        { latitude: 52.225, longitude: 21.005 },
        { latitude: 52.2297, longitude: 21.0122 },
        { latitude: 52.235, longitude: 21.02 },
      ],
      strokeColor: '#FF3B30',
      strokeWidth: 4,
      tappable: true,
    },
  ],
  polygons: [
    {
      id: 'district',
      coordinates: [
        { latitude: 52.24, longitude: 21.0 },
        { latitude: 52.245, longitude: 21.015 },
        { latitude: 52.235, longitude: 21.025 },
      ],
      fillColor: '#007AFF33',
      strokeColor: '#007AFF',
      strokeWidth: 2,
      tappable: true,
    },
  ],
  circles: [
    {
      id: 'radius',
      center: { latitude: 52.22, longitude: 21.01 },
      radius: 800,
      fillColor: '#34C75933',
      strokeColor: '#34C759',
      strokeWidth: 2,
      tappable: true,
    },
  ],
};
