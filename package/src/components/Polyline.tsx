import type { OverlayComponentType } from '../overlays/overlayType';
import { OverlayType } from '../overlays/overlayType';
import type { PolylineProps } from '../types/overlays';

/**
 * Polyline overlay child for {@linkcode MapView}.
 *
 * Props are collected by the parent `MapView` and serialized into a
 * {@linkcode PolylineDescriptor} passed to the native map view.
 */
export function Polyline(_props: PolylineProps): null {
  return null;
}

(Polyline as OverlayComponentType).overlayType = OverlayType.Polyline;
