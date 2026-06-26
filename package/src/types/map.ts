import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { Camera } from './camera';
import type { Coordinate } from './coordinate';
import type {
  CircleDescriptor,
  MarkerDescriptor,
  PolygonDescriptor,
  PolylineDescriptor,
} from '../native/specs/overlays';
import type { EdgePadding, Region } from './region';

/**
 * Available map display styles.
 */
export type MapType = 'standard' | 'satellite' | 'hybrid' | 'terrain';

/**
 * Props for the root map view component.
 */
export interface MapViewProps {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;

  /** Initial or controlled region. */
  region?: Region;

  /** Initial or controlled camera position. */
  camera?: Camera;

  /** Map display style. */
  mapType?: MapType;

  /** Whether the user can interact with the map. */
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  rotateEnabled?: boolean;
  pitchEnabled?: boolean;

  /** Whether to show the user's current location on the map. */
  showsUserLocation?: boolean;

  /** Whether the map camera should follow the user's location. */
  followsUserLocation?: boolean;

  /** Whether to show the compass control. */
  showsCompass?: boolean;

  /** Whether to show the scale control (iOS only). */
  showsScale?: boolean;

  /** Custom map style as a JSON string (full support on Android; curated subset on iOS 16+). */
  customMapStyle?: string;

  /** Whether to cluster nearby markers. */
  clusteringEnabled?: boolean;

  /** Padding applied to map edges, in density-independent pixels. */
  mapPadding?: EdgePadding;

  /**
   * Bulk marker descriptors. Prefer this over {@linkcode Marker} children
   * when rendering hundreds or thousands of markers.
   */
  markers?: MarkerDescriptor[];

  /** Bulk polyline descriptors. */
  polylines?: PolylineDescriptor[];

  /** Bulk polygon descriptors. */
  polygons?: PolygonDescriptor[];

  /** Bulk circle descriptors. */
  circles?: CircleDescriptor[];

  /** Called when any marker is pressed (bulk or child overlays). */
  onMarkerPress?: (id: string) => void;

  /** Called when any marker drag ends (bulk or child overlays). */
  onMarkerDragEnd?: (id: string, coordinate: Coordinate) => void;

  /** Called when any polyline is pressed (bulk or child overlays). */
  onPolylinePress?: (id: string) => void;

  /** Called when any polygon is pressed (bulk or child overlays). */
  onPolygonPress?: (id: string) => void;

  /** Called when any circle is pressed (bulk or child overlays). */
  onCirclePress?: (id: string) => void;

  /** Called when the map region changes after user interaction. */
  onRegionChange?: (region: Region) => void;

  /** Called when the map region change completes. */
  onRegionChangeComplete?: (region: Region) => void;

  /** Called when the map is ready to use. */
  onMapReady?: () => void;

  /** Called when the user presses the map. */
  onPress?: (coordinate: Coordinate) => void;

  /** Called when the user long-presses the map. */
  onLongPress?: (coordinate: Coordinate) => void;

  /** Called when a marker cluster is pressed. */
  onClusterPress?: (markerIds: string[], coordinate: Coordinate) => void;
}
