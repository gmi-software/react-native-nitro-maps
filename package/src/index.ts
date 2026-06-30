export { MapView, Marker, Polyline, Polygon, Circle } from './components';

export type {
  Coordinate,
  Region,
  Camera,
  EdgePadding,
  VisibleRegion,
  ApplePoiCategory,
  ApplePoiPressEvent,
  GooglePoiPressEvent,
  MapProvider,
  MapType,
  MapViewProps,
  MapViewPropsForProvider,
  PoiPressEvent,
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
