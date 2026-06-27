import { advancedFeaturesScenario } from './advancedFeatures';
import { allOverlaysScenario } from './allOverlays';
import {
  createCustomMarkerImagesScenario,
  customMarkerImagesScenario,
  CUSTOM_MARKER_IMAGES_SCENARIO_ID,
} from './customMarkerImages';
import { deliveryZoneScenario } from './deliveryZone';
import { landmarksScenario } from './landmarks';
import { riverRouteScenario } from './riverRoute';
import type { MapScenario } from './types';

export type { MapScenario } from './types';
export {
  createCustomMarkerImagesScenario,
  CUSTOM_MARKER_IMAGES_SCENARIO_ID,
};

export const MAP_SCENARIOS: MapScenario[] = [
  allOverlaysScenario,
  landmarksScenario,
  customMarkerImagesScenario,
  riverRouteScenario,
  deliveryZoneScenario,
  advancedFeaturesScenario,
];
