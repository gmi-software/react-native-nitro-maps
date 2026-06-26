import type { MapViewProps, MapViewPropsForProvider } from '../src';

export const appleProps: MapViewPropsForProvider<'apple'> = {
  provider: 'apple',
  showsScale: true,
  clusteringEnabled: true,
};

export const googleProps: MapViewPropsForProvider<'google'> = {
  provider: 'google',
  googleMapId: 'google-map-id',
  customMapStyle: '[]',
  clusteringEnabled: true,
};

export const defaultProviderProps: MapViewProps = {
  showsScale: true,
  customMapStyle: '[]',
};

export const plannedProviderProps: MapViewProps = {
  provider: 'mapbox',
};

export const googleScaleProps: MapViewPropsForProvider<'google'> = {
  provider: 'google',
  // @ts-expect-error Google Maps SDK does not expose a native scale control.
  showsScale: true,
};

export const appleMapIdProps: MapViewPropsForProvider<'apple'> = {
  provider: 'apple',
  // @ts-expect-error Google Map IDs are only supported by the Google provider.
  googleMapId: 'google-map-id',
};

export const openStreetMapClusteringProps: MapViewPropsForProvider<'openstreetmap'> =
  {
    provider: 'openstreetmap',
    // @ts-expect-error Planned OpenStreetMap support has no clustering capability yet.
    clusteringEnabled: true,
  };
