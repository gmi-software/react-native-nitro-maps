import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { callback } from 'react-native-nitro-modules';
import { useCollectedOverlays } from '../hooks/useCollectedOverlays';
import { NativeMapView } from '../native/MapViewNative';
import type { MapView as NativeMapViewHybrid } from '../native/specs/MapView.nitro';
import { OverlayType, overlayCallbackKey } from '../overlays/overlayType';
import type { Coordinate } from '../types/coordinate';
import type { MapViewProps } from '../types/map';
import type { MapViewRef } from '../types/ref';

export const MapView = forwardRef<MapViewRef, MapViewProps>(function MapView(
  {
    style,
    children,
    region,
    camera,
    mapType = 'standard',
    scrollEnabled,
    zoomEnabled,
    rotateEnabled,
    pitchEnabled,
    showsUserLocation,
    followsUserLocation,
    showsCompass,
    showsScale,
    customMapStyle,
    clusteringEnabled,
    mapPadding,
    markers: markersProp,
    polylines: polylinesProp,
    polygons: polygonsProp,
    circles: circlesProp,
    onRegionChange,
    onRegionChangeComplete,
    onMapReady,
    onPress,
    onLongPress,
    onClusterPress,
    onMarkerPress: onMarkerPressProp,
    onMarkerDragEnd: onMarkerDragEndProp,
    onPolylinePress: onPolylinePressProp,
    onPolygonPress: onPolygonPressProp,
    onCirclePress: onCirclePressProp,
  },
  ref,
) {
  const hybridRef = useRef<NativeMapViewHybrid>(null);
  const {
    markers: collectedMarkers,
    polylines: collectedPolylines,
    polygons: collectedPolygons,
    circles: collectedCircles,
    callbackRegistry,
    hasMarkerPress: hasCollectedMarkerPress,
    hasMarkerDragEnd: hasCollectedMarkerDragEnd,
    hasPolylinePress,
    hasPolygonPress,
    hasCirclePress,
  } = useCollectedOverlays(children);

  const markers =
    markersProp != null ? markersProp : collectedMarkers;
  const polylines =
    polylinesProp != null ? polylinesProp : collectedPolylines;
  const polygons =
    polygonsProp != null ? polygonsProp : collectedPolygons;
  const circles =
    circlesProp != null ? circlesProp : collectedCircles;

  const hasMarkerPress =
    onMarkerPressProp != null || hasCollectedMarkerPress;
  const hasMarkerDragEnd =
    onMarkerDragEndProp != null || hasCollectedMarkerDragEnd;
  const hasPolylinePressHandler =
    onPolylinePressProp != null || hasPolylinePress;
  const hasPolygonPressHandler =
    onPolygonPressProp != null || hasPolygonPress;
  const hasCirclePressHandler =
    onCirclePressProp != null || hasCirclePress;

  const handleMarkerPress = useCallback(
    (id: string) => {
      callbackRegistry.current.get(overlayCallbackKey(OverlayType.Marker, id))?.onPress?.();
      onMarkerPressProp?.(id);
    },
    [callbackRegistry, onMarkerPressProp],
  );

  const handleMarkerDragEnd = useCallback(
    (id: string, coordinate: Coordinate) => {
      callbackRegistry.current.get(overlayCallbackKey(OverlayType.Marker, id))?.onDragEnd?.(coordinate);
      onMarkerDragEndProp?.(id, coordinate);
    },
    [callbackRegistry, onMarkerDragEndProp],
  );

  const handlePolylinePress = useCallback(
    (id: string) => {
      callbackRegistry.current.get(overlayCallbackKey(OverlayType.Polyline, id))?.onPress?.();
      onPolylinePressProp?.(id);
    },
    [callbackRegistry, onPolylinePressProp],
  );

  const handlePolygonPress = useCallback(
    (id: string) => {
      callbackRegistry.current.get(overlayCallbackKey(OverlayType.Polygon, id))?.onPress?.();
      onPolygonPressProp?.(id);
    },
    [callbackRegistry, onPolygonPressProp],
  );

  const handleCirclePress = useCallback(
    (id: string) => {
      callbackRegistry.current.get(overlayCallbackKey(OverlayType.Circle, id))?.onPress?.();
      onCirclePressProp?.(id);
    },
    [callbackRegistry, onCirclePressProp],
  );

  useImperativeHandle(
    ref,
    () => ({
      getCamera: () => {
        if (hybridRef.current == null) {
          return Promise.reject(new Error('MapView is not mounted'));
        }
        return hybridRef.current.fetchCamera();
      },
      setCamera: (nextCamera) => {
        hybridRef.current?.applyCamera(nextCamera);
      },
      animateCamera: (nextCamera, duration) => {
        hybridRef.current?.animateCamera(nextCamera, duration);
      },
      getVisibleRegion: () => {
        if (hybridRef.current == null) {
          return Promise.reject(new Error('MapView is not mounted'));
        }
        return hybridRef.current.getVisibleRegion();
      },
      fitToCoordinates: (coordinates, padding, animated) => {
        hybridRef.current?.fitToCoordinates(coordinates, padding, animated);
      },
    }),
    [],
  );

  return (
    <NativeMapView
      style={style}
      hybridRef={callback((nativeRef) => {
        hybridRef.current = nativeRef;
      })}
      mapType={mapType}
      region={region}
      camera={camera}
      scrollEnabled={scrollEnabled}
      zoomEnabled={zoomEnabled}
      rotateEnabled={rotateEnabled}
      pitchEnabled={pitchEnabled}
      showsUserLocation={showsUserLocation}
      followsUserLocation={followsUserLocation}
      showsCompass={showsCompass}
      showsScale={showsScale}
      customMapStyle={customMapStyle}
      clusteringEnabled={clusteringEnabled}
      mapPadding={mapPadding}
      markers={markers}
      polylines={polylines}
      polygons={polygons}
      circles={circles}
      onRegionChange={
        onRegionChange == null ? undefined : callback(onRegionChange)
      }
      onRegionChangeComplete={
        onRegionChangeComplete == null
          ? undefined
          : callback(onRegionChangeComplete)
      }
      onMapReady={onMapReady == null ? undefined : callback(onMapReady)}
      onPress={onPress == null ? undefined : callback(onPress)}
      onLongPress={onLongPress == null ? undefined : callback(onLongPress)}
      onClusterPress={
        onClusterPress == null ? undefined : callback(onClusterPress)
      }
      onMarkerPress={
        hasMarkerPress ? callback(handleMarkerPress) : undefined
      }
      onMarkerDragEnd={
        hasMarkerDragEnd ? callback(handleMarkerDragEnd) : undefined
      }
      onPolylinePress={
        hasPolylinePressHandler ? callback(handlePolylinePress) : undefined
      }
      onPolygonPress={
        hasPolygonPressHandler ? callback(handlePolygonPress) : undefined
      }
      onCirclePress={
        hasCirclePressHandler ? callback(handleCirclePress) : undefined
      }
    />
  );
});
