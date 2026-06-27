import type { MarkerImage } from '../native/specs/overlays';

export interface ResolvedAssetSource {
  uri: string;
  width?: number;
  height?: number;
  scale?: number;
}

export function markerImageFromResolvedAsset(
  resolved: ResolvedAssetSource | null | undefined,
): MarkerImage | undefined {
  if (resolved == null || resolved.uri.length === 0) {
    return undefined;
  }

  return {
    uri: resolved.uri,
    width: resolved.width,
    height: resolved.height,
    scale: resolved.scale,
  };
}

const MARKER_IMAGE_KEYS = new Set(['uri', 'width', 'height', 'scale']);

export function isMarkerImage(value: unknown): value is MarkerImage {
  if (typeof value !== 'object' || value == null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  if (typeof record.uri !== 'string') {
    return false;
  }

  if (record.width !== undefined && typeof record.width !== 'number') {
    return false;
  }

  if (record.height !== undefined && typeof record.height !== 'number') {
    return false;
  }

  if (record.scale !== undefined && typeof record.scale !== 'number') {
    return false;
  }

  for (const key of Object.keys(record)) {
    if (!MARKER_IMAGE_KEYS.has(key)) {
      return false;
    }
  }

  return true;
}
