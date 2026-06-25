import type { MapScenario } from './types';

/** Circle radius and polygon boundary illustrating a delivery service area. */
export const deliveryZoneScenario: MapScenario = {
  id: 'delivery-zone',
  name: 'Delivery zone',
  description: 'Circle radius + polygon area',
  region: {
    latitude: 52.2297,
    longitude: 21.0122,
    latitudeDelta: 0.06,
    longitudeDelta: 0.06,
  },
  markers: [
    {
      id: 'restaurant',
      coordinate: { latitude: 52.2297, longitude: 21.0122 },
      title: 'Bistro Central',
      subtitle: 'Delivery hub',
    },
  ],
  circles: [
    {
      id: 'max-radius',
      center: { latitude: 52.2297, longitude: 21.0122 },
      radius: 1500,
      fillColor: '#FF950033',
      strokeColor: '#FF9500',
      strokeWidth: 2,
      tappable: true,
    },
  ],
  polygons: [
    {
      id: 'priority-zone',
      coordinates: [
        { latitude: 52.238, longitude: 21.0 },
        { latitude: 52.242, longitude: 21.015 },
        { latitude: 52.235, longitude: 21.028 },
        { latitude: 52.225, longitude: 21.025 },
        { latitude: 52.22, longitude: 21.008 },
      ],
      fillColor: '#34C75944',
      strokeColor: '#34C759',
      strokeWidth: 2,
      tappable: true,
    },
  ],
};
