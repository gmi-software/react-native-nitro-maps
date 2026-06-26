import type { OverlayComponentType } from '../overlays/overlayType';
import { OverlayType } from '../overlays/overlayType';
import type { CircleProps } from '../types/overlays';

/**
 * Circle overlay child for {@linkcode MapView}.
 *
 * Props are collected by the parent `MapView` and serialized into a
 * {@linkcode CircleDescriptor} passed to the native map view.
 */
export function Circle(_props: CircleProps): null {
  return null;
}

(Circle as OverlayComponentType).overlayType = OverlayType.Circle;
