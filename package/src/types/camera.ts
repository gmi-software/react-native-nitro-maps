import type { Coordinate } from './coordinate';

/**
 * Camera position and orientation for the map view.
 */
export interface Camera {
  center: Coordinate;
  zoom?: number;
  heading?: number;
  pitch?: number;
  altitude?: number;
}
