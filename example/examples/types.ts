import type {
  CircleProps,
  EdgePadding,
  MarkerProps,
  PolygonProps,
  PolylineProps,
  Region,
} from 'react-native-nitro-maps';

export interface MapScenarioAdvancedOptions {
  clusteringEnabled?: boolean;
  showsUserLocation?: boolean;
  followsUserLocation?: boolean;
  showsCompass?: boolean;
  showsScale?: boolean;
  customMapStyle?: string;
  mapPadding?: EdgePadding;
  fitToCoordinatesOnReady?: boolean;
}

export interface MapScenario {
  id: string;
  name: string;
  description: string;
  region: Region;
  markers?: Omit<MarkerProps, 'onPress' | 'onDragEnd'>[];
  polylines?: Omit<PolylineProps, 'onPress'>[];
  polygons?: Omit<PolygonProps, 'onPress'>[];
  circles?: Omit<CircleProps, 'onPress'>[];
  advanced?: MapScenarioAdvancedOptions;
}
