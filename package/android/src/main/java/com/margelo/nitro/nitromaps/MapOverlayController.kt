package com.margelo.nitro.nitromaps

import android.animation.ValueAnimator
import android.os.Handler
import android.os.Looper
import com.facebook.react.uimanager.ThemedReactContext
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.model.Circle
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.Marker
import com.google.android.gms.maps.model.MarkerOptions
import com.google.android.gms.maps.model.Polygon
import com.google.android.gms.maps.model.Polyline
import java.util.concurrent.Executors

/** Reconciles overlay descriptors with Google Maps overlay objects. */
class MapOverlayController(
  private var googleMap: GoogleMap?,
  private val context: ThemedReactContext,
) {
  private val markers = HashMap<String, Marker>()
  private val clusterByKey = HashMap<String, ClusterElement.Cluster>()
  private val polylines = LinkedHashMap<String, Polyline>()
  private val polygons = LinkedHashMap<String, Polygon>()
  private val circles = LinkedHashMap<String, Circle>()
  private var clusteringEnabled = false
  private var onMarkerPress: ((String) -> Unit)? = null
  private var onClusterPress: ((List<String>, Coordinate) -> Unit)? = null
  private var allMarkerDescriptors: Array<MarkerDescriptor> = emptyArray()
  private var markersFingerprint: Int = 0
  private var spatialIndex: MarkerSpatialIndex? = null
  private var refreshGeneration: Int = 0
  private var viewWidthPx: Int = 0
  private var viewHeightPx: Int = 0
  private var liveRefreshPending = false
  private var computeExecutor = Executors.newSingleThreadExecutor()
  private val mainHandler = Handler(Looper.getMainLooper())
  private val density: Float = context.resources.displayMetrics.density
  private val iconFactory = ClusterIconFactory(density)

  fun setGoogleMap(map: GoogleMap?) {
    googleMap = map
    if (map == null) {
      clear()
    }
  }

  /** Updates the cached map viewport size used to size the clustering grid. */
  fun setViewportSize(widthPx: Int, heightPx: Int) {
    viewWidthPx = widthPx
    viewHeightPx = heightPx
  }

  fun setClusteringEnabled(enabled: Boolean) {
    if (clusteringEnabled == enabled) {
      return
    }

    clusteringEnabled = enabled
    reapplyMarkers()
  }

  fun setMarkerPressHandlers(
    onMarkerPress: ((String) -> Unit)?,
    onClusterPress: ((List<String>, Coordinate) -> Unit)?,
  ) {
    this.onMarkerPress = onMarkerPress
    this.onClusterPress = onClusterPress
  }

  fun clear() {
    markers.values.forEach { it.remove() }
    polylines.values.forEach { it.remove() }
    polygons.values.forEach { it.remove() }
    circles.values.forEach { it.remove() }
    markers.clear()
    clusterByKey.clear()
    polylines.clear()
    polygons.clear()
    circles.clear()
    allMarkerDescriptors = emptyArray()
    markersFingerprint = 0
    spatialIndex = null
    refreshGeneration += 1
    computeExecutor.shutdown()
    computeExecutor = Executors.newSingleThreadExecutor()
  }

  fun setMarkers(descriptors: Array<MarkerDescriptor>?) {
    val next = descriptors ?: emptyArray()
    val fingerprint = MarkerViewportFilter.markersFingerprint(next)
    if (fingerprint == markersFingerprint) {
      return
    }

    markersFingerprint = fingerprint
    allMarkerDescriptors = next
    spatialIndex = null
    reapplyMarkers()
  }

  /**
   * Whether markers are driven by the background viewport pipeline (clustering
   * or large LOD) rather than the synchronous small-dataset path.
   */
  private fun usesViewportPipeline(): Boolean {
    return clusteringEnabled || allMarkerDescriptors.size > ASYNC_THRESHOLD
  }

  private fun reapplyMarkers() {
    googleMap ?: return
    if (usesViewportPipeline()) {
      rebuildIndexAndRefresh()
    } else {
      applyMarkersSync(allMarkerDescriptors)
    }
  }

  fun refreshViewportMarkers() {
    val map = googleMap ?: return
    val index = spatialIndex ?: return
    if (!usesViewportPipeline()) {
      return
    }
    if (viewWidthPx <= 0 || viewHeightPx <= 0) {
      return
    }

    val bounds = map.projection.visibleRegion.latLngBounds
    val latitudeSpan = bounds.northeast.latitude - bounds.southwest.latitude
    val clustering = clusteringEnabled
    val widthPx = viewWidthPx
    val heightPx = viewHeightPx
    val displayed = HashSet(markers.keys)
    refreshGeneration += 1
    val generation = refreshGeneration

    computeExecutor.execute {
      val candidates = index.candidates(bounds)
      val elements: List<ClusterElement> = if (clustering) {
        MarkerClusterEngine.clusters(candidates, bounds, widthPx, heightPx, density)
      } else {
        MarkerViewportFilter.displaySubset(candidates, bounds, latitudeSpan)
          .map { ClusterElement.Single(it) }
      }

      val nextKeys = HashSet<String>(elements.size)
      val added = ArrayList<ClusterElement>()
      val retained = ArrayList<ClusterElement>()
      for (element in elements) {
        val key = element.diffKey
        if (!nextKeys.add(key)) {
          continue
        }
        if (displayed.contains(key)) {
          retained.add(element)
        } else {
          added.add(element)
        }
      }
      val removed = displayed - nextKeys

      mainHandler.post {
        if (generation != refreshGeneration) {
          return@post
        }
        applyDiff(removed, added, retained)
      }
    }
  }

  private fun rebuildIndexAndRefresh() {
    val descriptors = allMarkerDescriptors
    refreshGeneration += 1
    val generation = refreshGeneration

    computeExecutor.execute {
      val index = MarkerSpatialIndex(descriptors)
      mainHandler.post {
        if (generation != refreshGeneration) {
          return@post
        }
        spatialIndex = index
        refreshViewportMarkers()
      }
    }
  }

  private fun applyDiff(
    removedKeys: Set<String>,
    added: List<ClusterElement>,
    retained: List<ClusterElement>,
  ) {
    val map = googleMap ?: return

    for (key in removedKeys) {
      markers.remove(key)?.remove()
      clusterByKey.remove(key)
    }

    val addedMarkers = ArrayList<Marker>(added.size)
    for (element in added) {
      val key = element.diffKey
      when (element) {
        is ClusterElement.Single -> {
          map.addMarker(element.descriptor.toMarkerOptions())?.also { marker ->
            marker.tag = key
            markers[key] = marker
            addedMarkers.add(marker)
          }
        }
        is ClusterElement.Cluster -> {
          val options = MarkerOptions()
            .position(element.position)
            .icon(iconFactory.icon(element.count))
            .anchor(0.5f, 0.5f)
          map.addMarker(options)?.also { marker ->
            marker.tag = key
            markers[key] = marker
            clusterByKey[key] = element
            addedMarkers.add(marker)
          }
        }
      }
    }

    for (element in retained) {
      val key = element.diffKey
      val marker = markers[key] ?: continue
      when (element) {
        is ClusterElement.Single -> {
          marker.position = LatLng(
            element.descriptor.coordinate.latitude,
            element.descriptor.coordinate.longitude,
          )
          marker.title = element.descriptor.title
          marker.snippet = element.descriptor.subtitle
          marker.isDraggable = element.descriptor.draggable == true
        }
        is ClusterElement.Cluster -> {
          marker.position = element.position
          marker.setIcon(iconFactory.icon(element.count))
          clusterByKey[key] = element
        }
      }
    }

    animateFadeIn(addedMarkers)
  }

  /** Fades newly added markers in via a single shared animator. */
  private fun animateFadeIn(added: List<Marker>) {
    if (added.isEmpty()) {
      return
    }

    added.forEach { marker ->
      if (markers.containsValue(marker)) {
        marker.alpha = 0f
      }
    }
    ValueAnimator.ofFloat(0f, 1f).apply {
      duration = 220
      addUpdateListener { animator ->
        val value = animator.animatedValue as Float
        added.forEach { marker ->
          if (markers.containsValue(marker)) {
            marker.alpha = value
          }
        }
      }
      start()
    }
  }

  private fun applyMarkersSync(descriptors: Array<MarkerDescriptor>) {
    val map = googleMap ?: return
    reconcile(
      current = markers,
      next = descriptors.associate { ("s:" + it.id) to it },
      remove = { it.remove() },
      add = { descriptor ->
        map.addMarker(descriptor.toMarkerOptions())?.also { marker ->
          marker.tag = "s:" + descriptor.id
        }
      },
      update = { marker, descriptor ->
        marker.position = LatLng(
          descriptor.coordinate.latitude,
          descriptor.coordinate.longitude,
        )
        marker.title = descriptor.title
        marker.snippet = descriptor.subtitle
        marker.isDraggable = descriptor.draggable == true
        marker
      },
    )
  }

  fun onCameraIdle() {
    if (usesViewportPipeline()) {
      refreshViewportMarkers()
    }
  }

  /** Throttled live recompute while the camera is moving. */
  fun onCameraMove() {
    if (!usesViewportPipeline() || liveRefreshPending) {
      return
    }
    liveRefreshPending = true
    mainHandler.postDelayed({
      liveRefreshPending = false
      if (usesViewportPipeline()) {
        refreshViewportMarkers()
      }
    }, LIVE_REFRESH_THROTTLE_MS)
  }

  fun onMarkerClick(marker: Marker): Boolean {
    val key = marker.tag as? String ?: return false
    val cluster = clusterByKey[key]
    if (cluster != null) {
      onClusterPress?.invoke(
        cluster.memberIds,
        Coordinate(
          latitude = cluster.position.latitude,
          longitude = cluster.position.longitude,
        ),
      )
      googleMap?.animateCamera(
        CameraUpdateFactory.newLatLngBounds(cluster.bounds, (72 * density).toInt()),
      )
      return true
    }

    val id = markerOverlayIdFromTag(key)
    onMarkerPress?.invoke(id)
    return false
  }

  private fun markerOverlayIdFromTag(tag: String): String {
    return if (tag.startsWith("s:")) tag.substring(2) else tag
  }

  fun updatePolylines(descriptors: Array<PolylineDescriptor>?) {
    val map = googleMap ?: return
    reconcile(
      current = polylines,
      next = descriptors?.associateBy { it.id } ?: emptyMap(),
      remove = { it.remove() },
      add = { descriptor ->
        map.addPolyline(descriptor.toPolylineOptions()).also { polyline ->
          polyline.tag = descriptor.id
        }
      },
      update = { polyline, descriptor ->
        polyline.remove()
        map.addPolyline(descriptor.toPolylineOptions()).also { replacement ->
          replacement.tag = descriptor.id
        }
      },
    )
  }

  fun updatePolygons(descriptors: Array<PolygonDescriptor>?) {
    val map = googleMap ?: return
    reconcile(
      current = polygons,
      next = descriptors?.associateBy { it.id } ?: emptyMap(),
      remove = { it.remove() },
      add = { descriptor ->
        map.addPolygon(descriptor.toPolygonOptions()).also { polygon ->
          polygon.tag = descriptor.id
        }
      },
      update = { polygon, descriptor ->
        polygon.remove()
        map.addPolygon(descriptor.toPolygonOptions()).also { replacement ->
          replacement.tag = descriptor.id
        }
      },
    )
  }

  fun updateCircles(descriptors: Array<CircleDescriptor>?) {
    val map = googleMap ?: return
    reconcile(
      current = circles,
      next = descriptors?.associateBy { it.id } ?: emptyMap(),
      remove = { it.remove() },
      add = { descriptor ->
        map.addCircle(descriptor.toCircleOptions()).also { circle ->
          circle.tag = descriptor.id
        }
      },
      update = { circle, descriptor ->
        circle.remove()
        map.addCircle(descriptor.toCircleOptions()).also { replacement ->
          replacement.tag = descriptor.id
        }
      },
    )
  }

  private fun <T, Descriptor> reconcile(
    current: MutableMap<String, T>,
    next: Map<String, Descriptor>,
    remove: (T) -> Unit,
    add: (Descriptor) -> T?,
    update: (T, Descriptor) -> T,
  ) {
    val nextIds = next.keys
    val existingIds = current.keys

    for (removedId in existingIds - nextIds) {
      current.remove(removedId)?.let(remove)
    }

    for ((id, descriptor) in next) {
      val existing = current[id]
      if (existing == null) {
        add(descriptor)?.let { created ->
          current[id] = created
        }
      } else {
        current[id] = update(existing, descriptor)
      }
    }
  }

  private companion object {
    /** Non-clustered datasets at or below this size reconcile synchronously. */
    const val ASYNC_THRESHOLD = 500

    /** Minimum gap between live recomputes while the camera moves. */
    const val LIVE_REFRESH_THROTTLE_MS = 100L
  }
}
