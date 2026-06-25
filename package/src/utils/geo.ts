import type { Coordinate } from '../types/coordinate';
import type { Region } from '../types/region';

/**
 * Creates a Region from a center coordinate and deltas.
 */
export function regionFromCoordinate(
  coordinate: Coordinate,
  latitudeDelta = 0.01,
  longitudeDelta = 0.01,
): Region {
  return {
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    latitudeDelta,
    longitudeDelta,
  };
}

/**
 * Calculates the approximate distance between two coordinates in meters
 * using the Haversine formula.
 */
export function distanceBetween(
  from: Coordinate,
  to: Coordinate,
): number {
  const earthRadiusMeters = 6_371_000;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusMeters * c;
}
