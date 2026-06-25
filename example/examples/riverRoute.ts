import type { MapScenario } from './types';

/** A styled polyline tracing the Vistula river through Warsaw. */
export const riverRouteScenario: MapScenario = {
  id: 'river-route',
  name: 'River route',
  description: 'Styled polyline along the Vistula',
  region: {
    latitude: 52.23,
    longitude: 21.03,
    latitudeDelta: 0.12,
    longitudeDelta: 0.12,
  },
  polylines: [
    {
      id: 'vistula-north',
      coordinates: [
        { latitude: 52.265, longitude: 21.02 },
        { latitude: 52.255, longitude: 21.025 },
        { latitude: 52.245, longitude: 21.028 },
        { latitude: 52.235, longitude: 21.03 },
      ],
      strokeColor: '#007AFF',
      strokeWidth: 5,
      tappable: true,
    },
    {
      id: 'vistula-south',
      coordinates: [
        { latitude: 52.235, longitude: 21.03 },
        { latitude: 52.225, longitude: 21.032 },
        { latitude: 52.215, longitude: 21.035 },
        { latitude: 52.205, longitude: 21.038 },
      ],
      strokeColor: '#5856D6',
      strokeWidth: 5,
      tappable: true,
    },
  ],
  markers: [
    {
      id: 'route-start',
      coordinate: { latitude: 52.265, longitude: 21.02 },
      title: 'Route start',
      subtitle: 'North end of the trail',
    },
    {
      id: 'route-end',
      coordinate: { latitude: 52.205, longitude: 21.038 },
      title: 'Route end',
      subtitle: 'South end of the trail',
    },
  ],
};
