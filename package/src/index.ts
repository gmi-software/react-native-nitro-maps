export { MapView, Marker, Polyline, Polygon, Circle } from './components';

export type {
  Coordinate,
  Region,
  Camera,
  EdgePadding,
  VisibleRegion,
  MapProvider,
  MapType,
  MapViewProps,
  MapViewPropsForProvider,
  MarkerAnchor,
  MarkerImage,
  MarkerImageSource,
  MarkerDescriptor,
  MarkerPoint,
  MarkerProps,
  OverlayEnteringAnimation,
  OverlayEnteringAnimationConfig,
  OverlayEnteringAnimationPreset,
  OverlayEnteringAnimationReduceMotion,
  PolylineProps,
  PolygonProps,
  CircleProps,
  MapViewRef,
} from './types';

export { regionFromCoordinate, distanceBetween } from './utils';
