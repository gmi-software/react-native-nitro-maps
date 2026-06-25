import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { callback } from 'react-native-nitro-modules';
import { useCollectedOverlays } from '../hooks/useCollectedOverlays';
import { NativeMapView } from '../native/MapViewNative';
import type { MapView as NativeMapViewHybrid } from '../native/specs/MapView.nitro';
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
    onRegionChange,
    onRegionChangeComplete,
    onMapReady,
    onPress,
    onLongPress,
    onClusterPress,
  },
  ref,
) {
  const hybridRef = useRef<NativeMapViewHybrid>(null);
  const {
    markers,
    polylines,
    polygons,
    circles,
    callbackRegistry,
    hasMarkerPress,
    hasMarkerDragEnd,
    hasPolylinePress,
    hasPolygonPress,
    hasCirclePress,
  } = useCollectedOverlays(children);

  const handleMarkerPress = useCallback((id: string) => {
    callbackRegistry.current.get(id)?.onPress?.();
  }, [callbackRegistry]);

  const handleMarkerDragEnd = useCallback(
    (id: string, coordinate: Coordinate) => {
      callbackRegistry.current.get(id)?.onDragEnd?.(coordinate);
    },
    [callbackRegistry],
  );

  const handlePolylinePress = useCallback(
    (id: string) => {
      callbackRegistry.current.get(id)?.onPress?.();
    },
    [callbackRegistry],
  );

  const handlePolygonPress = useCallback(
    (id: string) => {
      callbackRegistry.current.get(id)?.onPress?.();
    },
    [callbackRegistry],
  );

  const handleCirclePress = useCallback(
    (id: string) => {
      callbackRegistry.current.get(id)?.onPress?.();
    },
    [callbackRegistry],
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
      markers={markers.length > 0 ? markers : undefined}
      polylines={polylines.length > 0 ? polylines : undefined}
      polygons={polygons.length > 0 ? polygons : undefined}
      circles={circles.length > 0 ? circles : undefined}
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
        hasPolylinePress ? callback(handlePolylinePress) : undefined
      }
      onPolygonPress={
        hasPolygonPress ? callback(handlePolygonPress) : undefined
      }
      onCirclePress={
        hasCirclePress ? callback(handleCirclePress) : undefined
      }
    />
  );
});
