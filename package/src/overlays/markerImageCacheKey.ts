import type { MarkerImage } from '../native/specs/overlays';

export function markerImageCacheKey(image: MarkerImage): string {
  return `${image.uri}|${image.width ?? ''}|${image.height ?? ''}|${image.scale ?? ''}`;
}
