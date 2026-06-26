package com.margelo.nitro.nitromaps

import com.google.android.gms.maps.model.LatLngBounds

/**
 * Uniform grid spatial index over a marker dataset.
 *
 * Built once per dataset so viewport queries cost O(cells in view + markers in
 * those cells) instead of O(all markers). Immutable after construction, so
 * instances are safe to query from a background thread.
 */
internal class MarkerSpatialIndex(
  markers: Array<MarkerDescriptor>,
  cellsPerSide: Int = 96,
) {
  val count: Int = markers.size
  private val side: Int = maxOf(1, cellsPerSide)
  private val minLat: Double
  private val minLon: Double
  private val latStep: Double
  private val lonStep: Double
  private val cells: Array<MutableList<MarkerDescriptor>>

  init {
    var minLatV = Double.MAX_VALUE
    var maxLatV = -Double.MAX_VALUE
    var minLonV = Double.MAX_VALUE
    var maxLonV = -Double.MAX_VALUE

    for (marker in markers) {
      val lat = marker.coordinate.latitude
      val lon = marker.coordinate.longitude
      if (lat < minLatV) minLatV = lat
      if (lat > maxLatV) maxLatV = lat
      if (lon < minLonV) minLonV = lon
      if (lon > maxLonV) maxLonV = lon
    }

    if (markers.isEmpty()) {
      minLatV = 0.0
      maxLatV = 0.0
      minLonV = 0.0
      maxLonV = 0.0
    }

    minLat = minLatV
    minLon = minLonV
    latStep = maxOf(1e-9, (maxLatV - minLatV) / side)
    lonStep = maxOf(1e-9, (maxLonV - minLonV) / side)
    cells = Array(side * side) { mutableListOf() }

    for (marker in markers) {
      val index = cellIndex(marker.coordinate.latitude, marker.coordinate.longitude)
      cells[index].add(marker)
    }
  }

  /** Markers whose grid cells overlap the padded bounds. */
  fun candidates(bounds: LatLngBounds, padding: Double = 0.2): List<MarkerDescriptor> {
    if (count == 0) {
      return emptyList()
    }

    val latSpan = bounds.northeast.latitude - bounds.southwest.latitude
    val lonSpan = bounds.northeast.longitude - bounds.southwest.longitude
    val latPad = latSpan * padding
    val lonPad = lonSpan * padding

    val rowStart = clampedRow(bounds.southwest.latitude - latPad)
    val rowEnd = clampedRow(bounds.northeast.latitude + latPad)
    val colStart = clampedColumn(bounds.southwest.longitude - lonPad)
    val colEnd = clampedColumn(bounds.northeast.longitude + lonPad)

    val result = ArrayList<MarkerDescriptor>()
    var row = rowStart
    while (row <= rowEnd) {
      val base = row * side
      var column = colStart
      while (column <= colEnd) {
        result.addAll(cells[base + column])
        column += 1
      }
      row += 1
    }
    return result
  }

  private fun cellIndex(lat: Double, lon: Double): Int {
    return clampedRow(lat) * side + clampedColumn(lon)
  }

  private fun clampedRow(lat: Double): Int {
    return minOf(side - 1, maxOf(0, ((lat - minLat) / latStep).toInt()))
  }

  private fun clampedColumn(lon: Double): Int {
    return minOf(side - 1, maxOf(0, ((lon - minLon) / lonStep).toInt()))
  }
}
