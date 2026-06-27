import { Image, type ImageSourcePropType } from 'react-native';
import type { ResolvedAssetSource } from './markerImageFromResolvedAsset';

export function resolveAssetSource(
  source: ImageSourcePropType | number,
): ResolvedAssetSource | null {
  return Image.resolveAssetSource(source);
}
