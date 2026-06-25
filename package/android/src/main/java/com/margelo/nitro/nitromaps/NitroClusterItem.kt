package com.margelo.nitro.nitromaps

import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.clustering.ClusterItem

/** Cluster item wrapping a marker descriptor for maps-utils clustering. */
class NitroClusterItem(
  val descriptor: MarkerDescriptor,
) : ClusterItem {
  override fun getPosition(): LatLng {
    return LatLng(
      descriptor.coordinate.latitude,
      descriptor.coordinate.longitude,
    )
  }

  override fun getTitle(): String? {
    return descriptor.title
  }

  override fun getSnippet(): String? {
    return descriptor.subtitle
  }

  override fun getZIndex(): Float? {
    return null
  }
}
