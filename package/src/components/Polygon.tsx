import type { OverlayComponentType } from '../overlays/overlayType';
import { OverlayType } from '../overlays/overlayType';
import type { PolygonProps } from '../types/overlays';

/**
 * Polygon overlay child for {@linkcode MapView}.
 *
 * Props are collected by the parent `MapView` and serialized into a
 * {@linkcode PolygonDescriptor} passed to the native map view.
 */
export function Polygon(_props: PolygonProps): null {
  return null;
}

(Polygon as OverlayComponentType).overlayType = OverlayType.Polygon;
