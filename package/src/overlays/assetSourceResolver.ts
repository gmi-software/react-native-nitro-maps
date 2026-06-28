import { Image, type ImageSourcePropType } from 'react-native';
import type { MarkerImage } from '../native/specs/overlays';

export function resolveAssetSource(
  source: ImageSourcePropType | number,
): MarkerImage | null {
  return Image.resolveAssetSource(source);
}
