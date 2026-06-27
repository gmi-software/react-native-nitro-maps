import type { MarkerDescriptor } from '../native/specs/overlays';
import { resolveMarkerImage } from './resolveMarkerImage';

export function normalizeMarkerDescriptors(
  descriptors: MarkerDescriptor[],
): MarkerDescriptor[] {
  let changed = false;
  const next = descriptors.map((descriptor) => {
    if (descriptor.image == null) {
      return descriptor;
    }

    const resolvedImage = resolveMarkerImage(descriptor.image);
    if (resolvedImage === descriptor.image) {
      return descriptor;
    }

    changed = true;
    return {
      ...descriptor,
      image: resolvedImage,
    };
  });

  return changed ? next : descriptors;
}
