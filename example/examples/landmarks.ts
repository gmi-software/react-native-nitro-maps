import type { MapScenario } from './types';

/** Multiple markers with title/subtitle callouts around central Warsaw. */
export const landmarksScenario: MapScenario = {
  id: 'landmarks',
  name: 'Landmarks',
  description: 'Markers with callouts',
  region: {
    latitude: 52.235,
    longitude: 21.02,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  },
  markers: [
    {
      id: 'palace-of-culture',
      coordinate: { latitude: 52.2319, longitude: 21.0067 },
      title: 'Palace of Culture',
      subtitle: 'Iconic Stalinist skyscraper',
    },
    {
      id: 'old-town',
      coordinate: { latitude: 52.2498, longitude: 21.0122 },
      title: 'Old Town',
      subtitle: 'UNESCO World Heritage Site',
    },
    {
      id: 'lazienki-park',
      coordinate: { latitude: 52.2156, longitude: 21.0354 },
      title: 'Łazienki Park',
      subtitle: 'Royal baths and gardens',
    },
    {
      id: 'national-stadium',
      coordinate: { latitude: 52.2394, longitude: 21.0453 },
      title: 'National Stadium',
      subtitle: 'PGE Narodowy',
    },
    {
      id: 'warsaw-uprising-museum',
      coordinate: { latitude: 52.2322, longitude: 20.981 },
      title: 'Warsaw Uprising Museum',
      subtitle: 'Interactive history museum',
      draggable: true,
    },
  ],
};
