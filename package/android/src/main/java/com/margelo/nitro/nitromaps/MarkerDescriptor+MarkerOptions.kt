package com.margelo.nitro.nitromaps

import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.MarkerOptions

fun MarkerDescriptor.toMarkerOptions(): MarkerOptions {
  return MarkerOptions()
    .position(LatLng(coordinate.latitude, coordinate.longitude))
    .title(title)
    .snippet(subtitle)
    .draggable(draggable == true)
}
