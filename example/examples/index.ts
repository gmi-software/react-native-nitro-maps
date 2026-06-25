import { advancedFeaturesScenario } from './advancedFeatures';
import { allOverlaysScenario } from './allOverlays';
import { deliveryZoneScenario } from './deliveryZone';
import { landmarksScenario } from './landmarks';
import { riverRouteScenario } from './riverRoute';
import type { MapScenario } from './types';

export type { MapScenario } from './types';

export const MAP_SCENARIOS: MapScenario[] = [
  allOverlaysScenario,
  landmarksScenario,
  riverRouteScenario,
  deliveryZoneScenario,
  advancedFeaturesScenario,
];
