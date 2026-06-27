package com.margelo.nitro.nitromaps

internal fun Array<MarkerDescriptor>?.markersFingerprint(): Int {
  if (this.isNullOrEmpty()) {
    return 0
  }

  var hash = size
  for (descriptor in this) {
    hash = 31 * hash + descriptor.hashCode()
  }
  return hash
}
