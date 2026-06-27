package com.margelo.nitro.nitromaps

import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.MarkerOptions

fun MarkerDescriptor.toMarkerOptions(): MarkerOptions =
  MarkerOptions()
    .position(LatLng(coordinate.latitude, coordinate.longitude))
    .title(title)
    .snippet(subtitle)
    .draggable(draggable == true)

internal fun MarkerDescriptor.effectiveGoogleMapsAnchor(
  widthPx: Float,
  heightPx: Float,
): Pair<Float, Float> {
  val anchorX = anchor?.x?.toFloat() ?: 0.5f
  val anchorY = anchor?.y?.toFloat() ?: 1.0f
  if (widthPx <= 0f || heightPx <= 0f) {
    return anchorX to anchorY
  }

  val offsetX = centerOffset?.x?.toFloat() ?: 0f
  val offsetY = centerOffset?.y?.toFloat() ?: 0f
  return (anchorX - offsetX / widthPx) to (anchorY - offsetY / heightPx)
}
