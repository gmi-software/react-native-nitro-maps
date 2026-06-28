import type {
  MarkerDescriptor as PublicMarkerDescriptor,
  OverlayEnteringAnimation,
} from '../types/overlays';
import type {
  MarkerDescriptor,
  OverlayEnteringAnimationDescriptor,
} from '../native/specs/overlays';

export function normalizeEnteringAnimation(
  animation: OverlayEnteringAnimation | undefined,
): OverlayEnteringAnimationDescriptor | undefined {
  if (animation == null) {
    return undefined;
  }

  if (animation === false) {
    return { kind: 'none' };
  }

  if (animation === 'system') {
    return { kind: 'system' };
  }

  return {
    kind: animation.preset,
    duration: animation.duration,
    delay: animation.delay,
    reduceMotion: animation.reduceMotion,
  };
}

export function normalizeMarkerDescriptor(
  marker: PublicMarkerDescriptor,
): MarkerDescriptor {
  return {
    id: marker.id,
    coordinate: marker.coordinate,
    title: marker.title,
    subtitle: marker.subtitle,
    draggable: marker.draggable,
    clusterable: marker.clusterable,
    enteringAnimation: normalizeEnteringAnimation(marker.enteringAnimation),
  };
}
