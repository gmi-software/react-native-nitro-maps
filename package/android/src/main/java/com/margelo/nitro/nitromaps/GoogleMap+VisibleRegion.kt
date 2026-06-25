package com.margelo.nitro.nitromaps

import com.google.android.gms.maps.Projection
import com.google.android.gms.maps.model.LatLng

fun Projection.toNitroVisibleRegion(): VisibleRegion {
  val visible = visibleRegion
  return VisibleRegion(
    nearLeft = visible.nearLeft.toCoordinate(),
    nearRight = visible.nearRight.toCoordinate(),
    farLeft = visible.farLeft.toCoordinate(),
    farRight = visible.farRight.toCoordinate(),
  )
}

fun LatLng.toCoordinate(): Coordinate {
  return Coordinate(latitude = latitude, longitude = longitude)
}
