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
 * Native rendering backend for the map view.
 */
export type MapProvider = 'apple' | 'google' | 'openstreetmap' | 'mapbox';

/**
 * Props shared by all map providers.
 */
interface BaseMapViewProps {
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

  /** Called when any marker is pressed. */
  onMarkerPress?: (id: string) => void;

  /** Called when any marker drag ends. */
  onMarkerDragEnd?: (id: string, coordinate: Coordinate) => void;

  /** Called when any polyline is pressed. */
  onPolylinePress?: (id: string) => void;

  /** Called when any polygon is pressed. */
  onPolygonPress?: (id: string) => void;

  /** Called when any circle is pressed. */
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

interface ExistingDefaultProviderProps extends BaseMapViewProps {
  /**
   * Optional provider. When omitted, iOS uses Apple MapKit and Android uses
   * Google Maps.
   */
  provider?: undefined;

  /** Google Map IDs are only supported by the Google provider. */
  googleMapId?: never;

  /** Whether to show the scale control (supported by Apple MapKit). */
  showsScale?: boolean;

  /** Custom map style as a JSON string (full support on Google Maps; curated subset on Apple MapKit iOS 16+). */
  customMapStyle?: string;

  /** Whether to cluster nearby markers. */
  clusteringEnabled?: boolean;
}

interface AppleMapViewProps extends BaseMapViewProps {
  provider: 'apple';

  /** Google Map IDs are only supported by the Google provider. */
  googleMapId?: never;

  /** Whether to show the scale control. */
  showsScale?: boolean;

  /** Custom map style as a JSON string. Apple MapKit applies a curated subset on iOS 16+. */
  customMapStyle?: string;

  /** Whether to cluster nearby markers. */
  clusteringEnabled?: boolean;
}

interface GoogleMapViewProps extends BaseMapViewProps {
  provider: 'google';

  /** Google Cloud Map ID for cloud-based Google Maps styling. */
  googleMapId?: string;

  /** Google Maps SDK has no native scale control. */
  showsScale?: never;

  /** Custom Google Maps style JSON. */
  customMapStyle?: string;

  /** Whether to cluster nearby markers. */
  clusteringEnabled?: boolean;
}

interface OpenStreetMapViewProps extends BaseMapViewProps {
  provider: 'openstreetmap';
  googleMapId?: never;
  showsScale?: never;
  customMapStyle?: never;
  clusteringEnabled?: never;
}

interface MapboxMapViewProps extends BaseMapViewProps {
  provider: 'mapbox';
  googleMapId?: never;
  showsScale?: never;
  customMapStyle?: never;
  clusteringEnabled?: never;
}

export type MapViewPropsForProvider<Provider extends MapProvider> =
  Provider extends 'apple'
    ? AppleMapViewProps
    : Provider extends 'google'
      ? GoogleMapViewProps
      : Provider extends 'openstreetmap'
        ? OpenStreetMapViewProps
        : Provider extends 'mapbox'
          ? MapboxMapViewProps
          : never;

/**
 * Props for the root map view component.
 */
export type MapViewProps =
  | ExistingDefaultProviderProps
  | AppleMapViewProps
  | GoogleMapViewProps
  | OpenStreetMapViewProps
  | MapboxMapViewProps;
