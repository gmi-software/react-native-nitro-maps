import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  LinearTransition,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  MapView,
  type Coordinate,
  type EdgePadding,
  type MapType,
  type MapViewRef,
} from 'react-native-nitro-maps';
import { MAP_SCENARIOS, type MapScenario } from './examples';

const MAP_TYPES: MapType[] = ['standard', 'satellite', 'hybrid'];

const MAP_TYPE_LABELS: Record<MapType, string> = {
  standard: 'Standard',
  satellite: 'Satellite',
  hybrid: 'Hybrid',
  terrain: 'Terrain',
};

/** Left inset reserved for the native map scale control. */
const SCALE_GUTTER_WIDTH = 156;

const springSnappy = { damping: 22, stiffness: 420 };
const springSoft = { damping: 20, stiffness: 240 };

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function mergeMapPadding(
  padding: EdgePadding | undefined,
  showsScale: boolean,
  showsCompass: boolean,
): EdgePadding | undefined {
  if (padding == null && !showsScale) {
    return undefined;
  }

  const base = padding ?? { top: 0, right: 0, bottom: 0, left: 0 };

  if (!showsScale) {
    return base;
  }

  return {
    top: Math.max(base.top, 56),
    right: Math.max(base.right, showsCompass ? 52 : 16),
    bottom: base.bottom,
    left: Math.max(base.left, 12),
  };
}

const palette = {
  surface: 'rgba(18, 18, 20, 0.9)',
  surfaceElevated: 'rgba(28, 28, 32, 0.96)',
  border: 'rgba(255, 255, 255, 0.1)',
  borderStrong: 'rgba(255, 255, 255, 0.18)',
  accent: '#3B82F6',
  accentSoft: 'rgba(59, 130, 246, 0.22)',
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.72)',
  textMuted: 'rgba(255, 255, 255, 0.48)',
  success: '#34D399',
  warning: '#FBBF24',
};

type ScalePressableProps = {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  hitSlop?: number;
};

const ScalePressable = memo(function ScalePressable({
  onPress,
  style,
  children,
  hitSlop,
}: ScalePressableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      hitSlop={hitSlop}
      style={[style, animatedStyle]}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.96, springSnappy);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, springSnappy);
      }}
    >
      {children}
    </AnimatedPressable>
  );
});

type StatusDotProps = {
  mapReady: boolean;
};

const StatusDot = memo(function StatusDot({ mapReady }: StatusDotProps) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (mapReady) {
      cancelAnimation(opacity);
      opacity.value = withTiming(1, { duration: 200 });
      return;
    }

    opacity.value = withRepeat(
      withSequence(
        withTiming(0.35, {
          duration: 700,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(1, {
          duration: 700,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      false,
    );
  }, [mapReady, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    backgroundColor: mapReady ? palette.success : palette.warning,
  }));

  return <Animated.View style={[styles.statusDot, animatedStyle]} />;
});

type ScenarioChipProps = {
  index: number;
  label: string;
  active: boolean;
  onPress: () => void;
};

const ScenarioChip = memo(function ScenarioChip({
  index,
  label,
  active,
  onPress,
}: ScenarioChipProps) {
  return (
    <Animated.View layout={LinearTransition.springify().damping(20).stiffness(260)}>
      <ScalePressable
        onPress={onPress}
        style={[styles.scenarioChip, active && styles.scenarioChipActive]}
      >
        <Text
          style={[styles.scenarioChipIndex, active && styles.scenarioChipIndexActive]}
        >
          {index + 1}
        </Text>
        <Text
          style={[styles.scenarioChipText, active && styles.scenarioChipTextActive]}
        >
          {label}
        </Text>
      </ScalePressable>
    </Animated.View>
  );
});

type ScenarioDockProps = {
  scenario: MapScenario;
  scenarioIndex: number;
  expanded: boolean;
  mapTypeLabel: MapType;
  onToggleExpanded: () => void;
  onSelect: (index: number) => void;
  onAnimateCamera: () => void;
  onGetCamera: () => void;
  onCycleMapType: () => void;
};

const ScenarioDock = memo(function ScenarioDock({
  scenario,
  scenarioIndex,
  expanded,
  mapTypeLabel,
  onToggleExpanded,
  onSelect,
  onAnimateCamera,
  onGetCamera,
  onCycleMapType,
}: ScenarioDockProps) {
  const chevronRotation = useSharedValue(0);

  useEffect(() => {
    chevronRotation.value = withTiming(expanded ? 180 : 0, {
      duration: 240,
      easing: Easing.out(Easing.cubic),
    });
  }, [expanded, chevronRotation]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

  return (
    <Animated.View
      entering={FadeInUp.duration(420).delay(120).springify().damping(20).stiffness(220)}
      layout={LinearTransition.springify().damping(20).stiffness(240)}
      style={[styles.dock, expanded && styles.dockExpandedContainer]}
    >
      {expanded ? (
        <Animated.View
          entering={FadeInDown.duration(260).springify().damping(20).stiffness(260)}
          exiting={FadeOut.duration(160)}
          style={styles.dockExpanded}
        >
          <View style={styles.dockHeader}>
            <View style={styles.dockHeaderText}>
              <Text style={styles.dockEyebrow}>
                Scenario {scenarioIndex + 1} of {MAP_SCENARIOS.length}
              </Text>
              <Text style={styles.dockTitle} numberOfLines={1}>
                {scenario.name}
              </Text>
            </View>
            <ScalePressable onPress={onToggleExpanded} hitSlop={8} style={styles.iconButton}>
              <Animated.Text style={[styles.iconButtonText, chevronStyle]}>▴</Animated.Text>
            </ScalePressable>
          </View>

          <Text style={styles.dockDescription}>{scenario.description}</Text>

          <View style={styles.divider} />

          <View style={styles.actionRow}>
            <ScalePressable onPress={onAnimateCamera} style={styles.actionButton}>
              <Text style={styles.actionButtonIcon}>↻</Text>
              <Text style={styles.actionButtonText}>Animate</Text>
            </ScalePressable>
            <ScalePressable onPress={onGetCamera} style={styles.actionButton}>
              <Text style={styles.actionButtonIcon}>◎</Text>
              <Text style={styles.actionButtonText}>Camera</Text>
            </ScalePressable>
            <ScalePressable
              onPress={onCycleMapType}
              style={[styles.actionButton, styles.actionButtonAccent]}
            >
              <Text style={styles.actionButtonIcon}>◫</Text>
              <Text style={styles.actionButtonText}>
                {MAP_TYPE_LABELS[mapTypeLabel]}
              </Text>
            </ScalePressable>
          </View>
        </Animated.View>
      ) : null}

      <View style={styles.dockRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scenarioScroll}
          contentContainerStyle={styles.scenarioPicker}
        >
          {MAP_SCENARIOS.map((item, index) => (
            <ScenarioChip
              key={item.id}
              index={index}
              label={item.name}
              active={index === scenarioIndex}
              onPress={() => onSelect(index)}
            />
          ))}
        </ScrollView>
        {!expanded ? (
          <ScalePressable onPress={onToggleExpanded} hitSlop={8} style={styles.iconButton}>
            <Animated.Text style={[styles.iconButtonText, chevronStyle]}>▴</Animated.Text>
          </ScalePressable>
        ) : null}
      </View>
    </Animated.View>
  );
});

type MapSceneProps = {
  scenario: MapScenario;
  mapType: MapType;
  mapPadding?: EdgePadding;
  onMapReady: () => void;
  onClusterPress: (markerIds: string[], coordinate: Coordinate) => void;
  onMarkerPress: (id: string) => void;
  onMarkerDragEnd: (id: string, coordinate: Coordinate) => void;
  onOverlayPress: (label: string) => void;
  onPress: (coordinate: Coordinate) => void;
  onLongPress: (coordinate: Coordinate) => void;
};

const MapScene = memo(
  forwardRef<MapViewRef, MapSceneProps>(function MapScene(
    {
      scenario,
      mapType,
      mapPadding,
      onMapReady,
      onClusterPress,
      onMarkerPress,
      onMarkerDragEnd,
      onOverlayPress,
      onPress,
      onLongPress,
    },
    ref,
  ) {
    return (
      <MapView
        ref={ref}
        key={scenario.id}
        style={styles.map}
        mapType={mapType}
        region={scenario.region}
        clusteringEnabled={scenario.advanced?.clusteringEnabled}
        showsUserLocation={scenario.advanced?.showsUserLocation}
        followsUserLocation={scenario.advanced?.followsUserLocation}
        showsCompass={scenario.advanced?.showsCompass}
        showsScale={scenario.advanced?.showsScale}
        customMapStyle={scenario.advanced?.customMapStyle}
        mapPadding={mapPadding}
        markers={scenario.markers}
        polylines={scenario.polylines}
        polygons={scenario.polygons}
        circles={scenario.circles}
        onMapReady={onMapReady}
        onClusterPress={onClusterPress}
        onMarkerPress={onMarkerPress}
        onMarkerDragEnd={onMarkerDragEnd}
        onPress={onPress}
        onLongPress={onLongPress}
        onPolylinePress={onOverlayPress}
        onPolygonPress={onOverlayPress}
        onCirclePress={onOverlayPress}
      />
    );
  }),
);

type StatusHeaderProps = {
  status: string;
  scenarioIndex: number;
  mapReady: boolean;
  showsScale: boolean;
};

const StatusHeader = memo(function StatusHeader({
  status,
  scenarioIndex,
  mapReady,
  showsScale,
}: StatusHeaderProps) {
  const badgeScale = useSharedValue(1);

  useEffect(() => {
    badgeScale.value = withSequence(
      withSpring(1.08, springSnappy),
      withSpring(1, springSoft),
    );
  }, [scenarioIndex, badgeScale]);

  const scenarioBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.duration(360).delay(60).springify().damping(20).stiffness(240)}
      style={[styles.header, showsScale && styles.headerWithScale]}
      pointerEvents="none"
    >
      {showsScale ? <View style={styles.scaleGutter} /> : null}

      <View style={styles.headerContent}>
        <View style={styles.headerTopRow}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandBadgeText}>NITRO MAPS</Text>
          </View>
          <Animated.View style={[styles.scenarioBadge, scenarioBadgeStyle]}>
            <Text style={styles.scenarioBadgeText}>
              {scenarioIndex + 1}/{MAP_SCENARIOS.length}
            </Text>
          </Animated.View>
        </View>

        <View style={styles.statusCard}>
          <StatusDot mapReady={mapReady} />
          <Animated.View
            key={status}
            entering={FadeIn.duration(180)}
            exiting={FadeOut.duration(120)}
            style={styles.statusTextWrap}
          >
            <Text style={styles.statusText} numberOfLines={2}>
              {status}
            </Text>
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
});

export default function App() {
  const mapRef = useRef<MapViewRef>(null);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [mapTypeIndex, setMapTypeIndex] = useState(0);
  const [status, setStatus] = useState('Waiting for map...');
  const [mapReady, setMapReady] = useState(false);
  const [dockExpanded, setDockExpanded] = useState(false);

  const scenario = MAP_SCENARIOS[scenarioIndex];
  const showsScale = scenario.advanced?.showsScale === true;
  const showsCompass = scenario.advanced?.showsCompass === true;
  const mapPadding = useMemo(
    () =>
      mergeMapPadding(scenario.advanced?.mapPadding, showsScale, showsCompass),
    [scenario, showsScale, showsCompass],
  );

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
      `zoom ${camera.zoom?.toFixed(1) ?? '?'} · ${camera.center.latitude.toFixed(4)}, ${camera.center.longitude.toFixed(4)}`,
    );
  }, []);

  const cycleMapType = useCallback(() => {
    setMapTypeIndex((current) => (current + 1) % MAP_TYPES.length);
  }, []);

  const selectScenario = useCallback((index: number) => {
    setScenarioIndex(index);
    setMapReady(false);
    setStatus(MAP_SCENARIOS[index].name);
  }, []);

  const toggleDockExpanded = useCallback(() => {
    setDockExpanded((current) => !current);
  }, []);

  const handleMarkerPress = useCallback((id: string) => {
    setStatus(`Marker · ${id}`);
  }, []);

  const handleMarkerDragEnd = useCallback(
    (id: string, coordinate: Coordinate) => {
      setStatus(
        `${id} → ${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`,
      );
    },
    [],
  );

  const handleOverlayPress = useCallback((label: string) => {
    setStatus(label);
  }, []);

  const handleClusterPress = useCallback(
    (markerIds: string[], coordinate: Coordinate) => {
      setStatus(
        `Cluster (${markerIds.length}) · ${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`,
      );
    },
    [],
  );

  const handleMapReady = useCallback(() => {
    setMapReady(true);
    setStatus(scenario.name);

    if (scenario.advanced?.fitToCoordinatesOnReady && scenario.markers != null) {
      mapRef.current?.fitToCoordinates(
        scenario.markers.map((marker) => marker.coordinate),
        scenario.advanced.mapPadding,
        true,
      );
    }
  }, [scenario]);

  const handleMapPress = useCallback((coordinate: Coordinate) => {
    setStatus(
      `${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`,
    );
  }, []);

  const handleMapLongPress = useCallback((coordinate: Coordinate) => {
    setStatus(
      `Long · ${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`,
    );
  }, []);

  return (
    <View style={styles.container}>
      <MapScene
        ref={mapRef}
        scenario={scenario}
        mapType={MAP_TYPES[mapTypeIndex]}
        mapPadding={mapPadding}
        onMapReady={handleMapReady}
        onClusterPress={handleClusterPress}
        onMarkerPress={handleMarkerPress}
        onMarkerDragEnd={handleMarkerDragEnd}
        onOverlayPress={handleOverlayPress}
        onPress={handleMapPress}
        onLongPress={handleMapLongPress}
      />

      <StatusHeader
        status={status}
        scenarioIndex={scenarioIndex}
        mapReady={mapReady}
        showsScale={showsScale}
      />

      <ScenarioDock
        scenario={scenario}
        scenarioIndex={scenarioIndex}
        expanded={dockExpanded}
        mapTypeLabel={MAP_TYPES[mapTypeIndex]}
        onToggleExpanded={toggleDockExpanded}
        onSelect={selectScenario}
        onAnimateCamera={handleAnimateCamera}
        onGetCamera={handleGetCamera}
        onCycleMapType={cycleMapType}
      />
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0B',
  },
  map: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  headerWithScale: {
    top: Platform.OS === 'ios' ? 56 : 20,
  },
  scaleGutter: {
    width: SCALE_GUTTER_WIDTH,
    height: 56,
    flexShrink: 0,
  },
  headerContent: {
    flex: 1,
    gap: 8,
    minWidth: 0,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandBadge: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  brandBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: palette.textSecondary,
  },
  scenarioBadge: {
    backgroundColor: palette.accentSoft,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.35)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  scenarioBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: palette.accent,
    fontVariant: ['tabular-nums'],
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.surfaceElevated,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 16,
    elevation: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusTextWrap: {
    flex: 1,
  },
  statusText: {
    fontSize: 13,
    lineHeight: 18,
    color: palette.text,
    fontVariant: ['tabular-nums'],
  },
  dock: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: Platform.OS === 'ios' ? 28 : 16,
    backgroundColor: palette.surfaceElevated,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 10,
  },
  dockExpandedContainer: {
    paddingTop: 12,
    paddingBottom: 12,
    gap: 12,
  },
  dockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scenarioScroll: {
    flex: 1,
  },
  dockHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  dockHeaderText: {
    flex: 1,
    gap: 2,
  },
  dockEyebrow: {
    fontSize: 11,
    fontWeight: '500',
    color: palette.textMuted,
    letterSpacing: 0.2,
  },
  dockTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: palette.text,
    letterSpacing: -0.2,
  },
  dockDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: palette.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: palette.border,
  },
  dockExpanded: {
    gap: 12,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonText: {
    fontSize: 12,
    color: palette.textSecondary,
    marginTop: -1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    gap: 2,
  },
  actionButtonAccent: {
    backgroundColor: palette.accentSoft,
    borderColor: 'rgba(59, 130, 246, 0.35)',
  },
  actionButtonIcon: {
    fontSize: 14,
    color: palette.textSecondary,
    lineHeight: 16,
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: palette.text,
  },
  scenarioPicker: {
    gap: 8,
    paddingVertical: 2,
  },
  scenarioChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: palette.border,
  },
  scenarioChipActive: {
    backgroundColor: palette.accentSoft,
    borderColor: 'rgba(59, 130, 246, 0.45)',
  },
  scenarioChipIndex: {
    fontSize: 10,
    fontWeight: '700',
    color: palette.textMuted,
    fontVariant: ['tabular-nums'],
  },
  scenarioChipIndexActive: {
    color: palette.accent,
  },
  scenarioChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: palette.textSecondary,
  },
  scenarioChipTextActive: {
    color: palette.text,
    fontWeight: '600',
  },
});
