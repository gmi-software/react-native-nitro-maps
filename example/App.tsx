import { memo, useCallback, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  Button,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Circle,
  MapView,
  Marker,
  Polygon,
  Polyline,
  type Coordinate,
  type MapType,
  type MapViewRef,
} from 'react-native-nitro-maps';
import { MAP_SCENARIOS, type MapScenario } from './examples';

const MAP_TYPES: MapType[] = ['standard', 'satellite', 'hybrid'];

type ScenarioInfoProps = {
  scenario: MapScenario;
  scenarioIndex: number;
  onSelect: (index: number) => void;
};

// Memoized so frequent `status` updates on the parent don't re-render the
// scenario title, description, and chip picker (none depend on `status`).
const ScenarioInfo = memo(function ScenarioInfo({
  scenario,
  scenarioIndex,
  onSelect,
}: ScenarioInfoProps) {
  return (
    <>
      <Text style={styles.scenarioTitle}>{scenario.name}</Text>
      <Text style={styles.scenarioDescription}>{scenario.description}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scenarioPicker}
      >
        {MAP_SCENARIOS.map((item, index) => (
          <Pressable
            key={item.id}
            style={[
              styles.scenarioChip,
              index === scenarioIndex && styles.scenarioChipActive,
            ]}
            onPress={() => onSelect(index)}
          >
            <Text
              style={[
                styles.scenarioChipText,
                index === scenarioIndex && styles.scenarioChipTextActive,
              ]}
            >
              {item.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </>
  );
});

type MapControlsProps = {
  mapTypeLabel: MapType;
  onAnimateCamera: () => void;
  onGetCamera: () => void;
  onCycleMapType: () => void;
};

// Memoized so the button row bails out of `status`-driven re-renders.
const MapControls = memo(function MapControls({
  mapTypeLabel,
  onAnimateCamera,
  onGetCamera,
  onCycleMapType,
}: MapControlsProps) {
  return (
    <View style={styles.buttons}>
      <Button title="Animate camera" onPress={onAnimateCamera} />
      <Button title="Get camera" onPress={onGetCamera} />
      <Button title={`Map type: ${mapTypeLabel}`} onPress={onCycleMapType} />
    </View>
  );
});

export default function App() {
  const mapRef = useRef<MapViewRef>(null);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [mapTypeIndex, setMapTypeIndex] = useState(0);
  const [status, setStatus] = useState('Waiting for map...');

  const scenario = MAP_SCENARIOS[scenarioIndex];

  const handleRegionChange = useCallback((region: MapScenario['region']) => {
    setStatus(
      `Region: ${region.latitude.toFixed(4)}, ${region.longitude.toFixed(4)}`,
    );
  }, []);

  const handleAnimateCamera = useCallback(() => {
    mapRef.current?.animateCamera(
      {
        center: {
          latitude: scenario.region.latitude,
          longitude: scenario.region.longitude,
        },
        zoom: 13,
        heading: 0,
        pitch: 0,
      },
      1,
    );
  }, [scenario]);

  const handleGetCamera = useCallback(async () => {
    const camera = await mapRef.current?.getCamera();
    if (camera == null) {
      return;
    }

    setStatus(
      `Camera zoom ${camera.zoom?.toFixed(1) ?? '?'} @ ${camera.center.latitude.toFixed(4)}, ${camera.center.longitude.toFixed(4)}`,
    );
  }, []);

  const cycleMapType = useCallback(() => {
    setMapTypeIndex((current) => (current + 1) % MAP_TYPES.length);
  }, []);

  const selectScenario = useCallback((index: number) => {
    setScenarioIndex(index);
    setStatus(`Scenario: ${MAP_SCENARIOS[index].name}`);
  }, []);

  const handleMarkerPress = useCallback((label: string) => {
    setStatus(`Marker pressed: ${label}`);
  }, []);

  const handleMarkerDragEnd = useCallback(
    (label: string, coordinate: Coordinate) => {
      setStatus(
        `${label} dragged to ${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`,
      );
    },
    [],
  );

  const handleOverlayPress = useCallback((label: string) => {
    setStatus(`${label} pressed`);
  }, []);

  const handleClusterPress = useCallback(
    (markerIds: string[], coordinate: Coordinate) => {
      setStatus(
        `Cluster (${markerIds.length} markers) @ ${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`,
      );
    },
    [],
  );

  const handleMapReady = useCallback(() => {
    setStatus(`Map ready — ${scenario.name}`);

    if (scenario.advanced?.fitToCoordinatesOnReady && scenario.markers != null) {
      mapRef.current?.fitToCoordinates(
        scenario.markers.map((marker) => marker.coordinate),
        scenario.advanced.mapPadding,
        true,
      );
    }
  }, [scenario]);

  return (
    <View style={styles.container}>
      <MapView
        key={scenario.id}
        ref={mapRef}
        style={styles.map}
        mapType={MAP_TYPES[mapTypeIndex]}
        region={scenario.region}
        clusteringEnabled={scenario.advanced?.clusteringEnabled}
        showsUserLocation={scenario.advanced?.showsUserLocation}
        followsUserLocation={scenario.advanced?.followsUserLocation}
        showsCompass={scenario.advanced?.showsCompass}
        showsScale={scenario.advanced?.showsScale}
        customMapStyle={scenario.advanced?.customMapStyle}
        mapPadding={scenario.advanced?.mapPadding}
        onMapReady={handleMapReady}
        onRegionChange={handleRegionChange}
        onRegionChangeComplete={handleRegionChange}
        onClusterPress={handleClusterPress}
        onPress={(coordinate) =>
          setStatus(
            `Map press: ${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`,
          )
        }
        onLongPress={(coordinate) =>
          setStatus(
            `Long press: ${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`,
          )
        }
      >
        {scenario.markers?.map((marker) => (
          <Marker
            key={marker.id}
            {...marker}
            onPress={() => handleMarkerPress(marker.title ?? marker.id ?? 'Marker')}
            onDragEnd={
              marker.draggable
                ? (coordinate) =>
                    handleMarkerDragEnd(
                      marker.title ?? marker.id ?? 'Marker',
                      coordinate,
                    )
                : undefined
            }
          />
        ))}
        {scenario.polylines?.map((polyline) => (
          <Polyline
            key={polyline.id}
            {...polyline}
            onPress={() => handleOverlayPress(polyline.id ?? 'Polyline')}
          />
        ))}
        {scenario.polygons?.map((polygon) => (
          <Polygon
            key={polygon.id}
            {...polygon}
            onPress={() => handleOverlayPress(polygon.id ?? 'Polygon')}
          />
        ))}
        {scenario.circles?.map((circle) => (
          <Circle
            key={circle.id}
            {...circle}
            onPress={() => handleOverlayPress(circle.id ?? 'Circle')}
          />
        ))}
      </MapView>

      <View style={styles.controls}>
        <ScenarioInfo
          scenario={scenario}
          scenarioIndex={scenarioIndex}
          onSelect={selectScenario}
        />
        <Text style={styles.status}>{status}</Text>
        <MapControls
          mapTypeLabel={MAP_TYPES[mapTypeIndex]}
          onAnimateCamera={handleAnimateCamera}
          onGetCamera={handleGetCamera}
          onCycleMapType={cycleMapType}
        />
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 32,
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 12,
    padding: 12,
  },
  scenarioTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  scenarioDescription: {
    fontSize: 13,
    color: '#666',
  },
  scenarioPicker: {
    gap: 8,
    paddingVertical: 4,
  },
  scenarioChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E5E5EA',
  },
  scenarioChipActive: {
    backgroundColor: '#007AFF',
  },
  scenarioChipText: {
    fontSize: 13,
    color: '#333',
  },
  scenarioChipTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  status: {
    fontSize: 13,
  },
  buttons: {
    gap: 8,
  },
});
