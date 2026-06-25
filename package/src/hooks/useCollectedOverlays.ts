import { Children, isValidElement, useMemo, useRef } from 'react';
import type { MutableRefObject, ReactNode } from 'react';
import type {
  CircleDescriptor,
  MarkerDescriptor,
  PolygonDescriptor,
  PolylineDescriptor,
} from '../native/specs/overlays';
import type {
  CircleProps,
  MarkerProps,
  PolygonProps,
  PolylineProps,
} from '../types/overlays';
import { Circle } from '../components/Circle';
import { Marker } from '../components/Marker';
import { Polygon } from '../components/Polygon';
import { Polyline } from '../components/Polyline';

interface OverlayCallbacks {
  onPress?: () => void;
  onDragEnd?: (coordinate: MarkerProps['coordinate']) => void;
}

export interface CollectedOverlays {
  markers: MarkerDescriptor[];
  polylines: PolylineDescriptor[];
  polygons: PolygonDescriptor[];
  circles: CircleDescriptor[];
  callbackRegistry: MutableRefObject<Map<string, OverlayCallbacks>>;
  hasMarkerPress: boolean;
  hasMarkerDragEnd: boolean;
  hasPolylinePress: boolean;
  hasPolygonPress: boolean;
  hasCirclePress: boolean;
}

function resolveOverlayId(
  providedId: string | undefined,
  type: string,
  index: number,
): string {
  if (providedId != null && providedId.length > 0) {
    return providedId;
  }

  return `${type}-${index}`;
}

export function useCollectedOverlays(children: ReactNode): CollectedOverlays {
  const callbackRegistry = useRef(new Map<string, OverlayCallbacks>());

  const overlays = useMemo(() => {
    const registry = new Map<string, OverlayCallbacks>();
    const markers: MarkerDescriptor[] = [];
    const polylines: PolylineDescriptor[] = [];
    const polygons: PolygonDescriptor[] = [];
    const circles: CircleDescriptor[] = [];

    let markerIndex = 0;
    let polylineIndex = 0;
    let polygonIndex = 0;
    let circleIndex = 0;
    let hasMarkerPress = false;
    let hasMarkerDragEnd = false;
    let hasPolylinePress = false;
    let hasPolygonPress = false;
    let hasCirclePress = false;

    Children.forEach(children, (child) => {
      if (!isValidElement(child)) {
        return;
      }

      if (child.type === Marker) {
        const props = child.props as MarkerProps;
        const id = resolveOverlayId(props.id, 'marker', markerIndex);
        markerIndex += 1;

        markers.push({
          id,
          coordinate: props.coordinate,
          title: props.title,
          subtitle: props.subtitle,
          draggable: props.draggable,
          clusterable: props.clusterable,
        });
        registry.set(id, {
          onPress: props.onPress,
          onDragEnd: props.onDragEnd,
        });
        if (props.onPress != null) {
          hasMarkerPress = true;
        }
        if (props.onDragEnd != null) {
          hasMarkerDragEnd = true;
        }
        return;
      }

      if (child.type === Polyline) {
        const props = child.props as PolylineProps;
        const id = resolveOverlayId(props.id, 'polyline', polylineIndex);
        polylineIndex += 1;

        polylines.push({
          id,
          coordinates: props.coordinates,
          strokeColor: props.strokeColor,
          strokeWidth: props.strokeWidth,
          tappable:
            props.onPress != null ? (props.tappable ?? true) : props.tappable,
        });
        registry.set(id, { onPress: props.onPress });
        if (props.onPress != null) {
          hasPolylinePress = true;
        }
        return;
      }

      if (child.type === Polygon) {
        const props = child.props as PolygonProps;
        const id = resolveOverlayId(props.id, 'polygon', polygonIndex);
        polygonIndex += 1;

        polygons.push({
          id,
          coordinates: props.coordinates,
          fillColor: props.fillColor,
          strokeColor: props.strokeColor,
          strokeWidth: props.strokeWidth,
          tappable:
            props.onPress != null ? (props.tappable ?? true) : props.tappable,
        });
        registry.set(id, { onPress: props.onPress });
        if (props.onPress != null) {
          hasPolygonPress = true;
        }
        return;
      }

      if (child.type === Circle) {
        const props = child.props as CircleProps;
        const id = resolveOverlayId(props.id, 'circle', circleIndex);
        circleIndex += 1;

        circles.push({
          id,
          center: props.center,
          radius: props.radius,
          fillColor: props.fillColor,
          strokeColor: props.strokeColor,
          strokeWidth: props.strokeWidth,
          tappable:
            props.onPress != null ? (props.tappable ?? true) : props.tappable,
        });
        registry.set(id, { onPress: props.onPress });
        if (props.onPress != null) {
          hasCirclePress = true;
        }
      }
    });

    callbackRegistry.current = registry;

    return {
      markers,
      polylines,
      polygons,
      circles,
      hasMarkerPress,
      hasMarkerDragEnd,
      hasPolylinePress,
      hasPolygonPress,
      hasCirclePress,
    };
  }, [children]);

  return {
    ...overlays,
    callbackRegistry,
  };
}
