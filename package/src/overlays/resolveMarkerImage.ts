import type { ImageSourcePropType } from 'react-native';
import type { MarkerImage } from '../native/specs/overlays';
import { resolveAssetSource } from './assetSourceResolver';
import { LruCache } from './lruCache';
import { markerImageCacheKey } from './markerImageCacheKey';
import {
  isMarkerImage,
  markerImageFromResolvedAsset,
} from './markerImageFromResolvedAsset';

const MARKER_IMAGE_CACHE_SIZE = 64;
const resolvedImageCache = new LruCache<string, MarkerImage>(MARKER_IMAGE_CACHE_SIZE);

export function resolveMarkerImage(
  source: ImageSourcePropType | MarkerImage | undefined,
): MarkerImage | undefined {
  if (source == null) {
    return undefined;
  }

  if (isMarkerImage(source)) {
    const key = markerImageCacheKey(source);
    const cached = resolvedImageCache.get(key);
    if (cached != null) {
      return cached;
    }
    resolvedImageCache.set(key, source);
    return source;
  }

  if (typeof source === 'number') {
    const requireKey = `require:${source}`;
    const cached = resolvedImageCache.get(requireKey);
    if (cached != null) {
      return cached;
    }

    const resolved = markerImageFromResolvedAsset(resolveAssetSource(source));
    if (resolved != null) {
      resolvedImageCache.set(requireKey, resolved);
    }
    return resolved;
  }

  const resolved = markerImageFromResolvedAsset(resolveAssetSource(source));
  if (resolved != null) {
    resolvedImageCache.set(markerImageCacheKey(resolved), resolved);
  }
  return resolved;
}

/** @internal Clears the module-level image resolution cache (tests only). */
export function clearResolvedMarkerImageCacheForTests(): void {
  resolvedImageCache.clear();
}
