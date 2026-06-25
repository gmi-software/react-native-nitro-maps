package com.margelo.nitro.nitromaps

import android.Manifest
import android.content.pm.PackageManager
import androidx.core.content.ContextCompat
import com.facebook.react.uimanager.ThemedReactContext
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.model.Circle
import com.google.android.gms.maps.model.Marker
import com.google.android.gms.maps.model.Polygon
import com.google.android.gms.maps.model.Polyline
import com.google.maps.android.clustering.ClusterManager
import com.google.maps.android.clustering.view.DefaultClusterRenderer

/** Reconciles overlay descriptors with Google Maps overlay objects. */
class MapOverlayController(
  private var googleMap: GoogleMap?,
  private val context: ThemedReactContext,
) {
  private val markers = LinkedHashMap<String, Marker>()
  private val polylines = LinkedHashMap<String, Polyline>()
  private val polygons = LinkedHashMap<String, Polygon>()
  private val circles = LinkedHashMap<String, Circle>()
  private var clusterManager: ClusterManager<NitroClusterItem>? = null
  private var clusteringEnabled = false
  private var onMarkerPress: ((String) -> Unit)? = null
  private var onClusterPress: ((List<String>, Coordinate) -> Unit)? = null

  fun setGoogleMap(map: GoogleMap?) {
    googleMap = map
    if (map == null) {
      clear()
    }
  }

  fun setClusteringEnabled(enabled: Boolean) {
    if (clusteringEnabled == enabled) {
      return
    }

    clusteringEnabled = enabled
    if (enabled) {
      markers.values.forEach { it.remove() }
      markers.clear()
      ensureClusterManager()
    } else {
      tearDownClusterManager()
    }
  }

  fun setMarkerPressHandlers(
    onMarkerPress: ((String) -> Unit)?,
    onClusterPress: ((List<String>, Coordinate) -> Unit)?,
  ) {
    this.onMarkerPress = onMarkerPress
    this.onClusterPress = onClusterPress
    clusterManager?.setOnClusterItemClickListener { item ->
      onMarkerPress?.invoke(item.descriptor.id)
      true
    }
    clusterManager?.setOnClusterClickListener { cluster ->
      val ids = cluster.items.map { it.descriptor.id }
      val position = cluster.position
      onClusterPress?.invoke(
        ids,
        Coordinate(
          latitude = position.latitude,
          longitude = position.longitude,
        ),
      )
      true
    }
  }

  fun clear() {
    tearDownClusterManager()
    markers.values.forEach { it.remove() }
    polylines.values.forEach { it.remove() }
    polygons.values.forEach { it.remove() }
    circles.values.forEach { it.remove() }
    markers.clear()
    polylines.clear()
    polygons.clear()
    circles.clear()
  }

  fun updateMarkers(descriptors: Array<MarkerDescriptor>?) {
    if (clusteringEnabled) {
      updateClusteredMarkers(descriptors)
      return
    }

    val map = googleMap ?: return
    reconcile(
      current = markers,
      next = descriptors?.associateBy { it.id } ?: emptyMap(),
      remove = { it.remove() },
      add = { descriptor ->
        map.addMarker(descriptor.toMarkerOptions())?.also { marker ->
          marker.tag = descriptor.id
        }
      },
      update = { marker, descriptor ->
        marker.position = com.google.android.gms.maps.model.LatLng(
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

  private fun updateClusteredMarkers(descriptors: Array<MarkerDescriptor>?) {
    val manager = ensureClusterManager() ?: return
    val nextItems = descriptors
      ?.filter { it.clusterable != false }
      ?.map { NitroClusterItem(it) }
      ?: emptyList()

    manager.clearItems()
    manager.addItems(nextItems)
    manager.cluster()
  }

  private fun ensureClusterManager(): ClusterManager<NitroClusterItem>? {
    val map = googleMap ?: return null
    if (clusterManager != null) {
      return clusterManager
    }

    val manager = ClusterManager<NitroClusterItem>(context, map)
    manager.renderer = object : DefaultClusterRenderer<NitroClusterItem>(context, map, manager) {
      override fun onBeforeClusterItemRendered(
        item: NitroClusterItem,
        markerOptions: com.google.android.gms.maps.model.MarkerOptions,
      ) {
        super.onBeforeClusterItemRendered(item, markerOptions)
      }
    }
    manager.setOnClusterItemClickListener { item ->
      onMarkerPress?.invoke(item.descriptor.id)
      true
    }
    manager.setOnClusterClickListener { cluster ->
      val ids = cluster.items.map { it.descriptor.id }
      val position = cluster.position
      onClusterPress?.invoke(
        ids,
        Coordinate(
          latitude = position.latitude,
          longitude = position.longitude,
        ),
      )
      true
    }

    clusterManager = manager
    return manager
  }

  fun onCameraIdle() {
    clusterManager?.onCameraIdle()
  }

  fun onMarkerClick(marker: Marker): Boolean {
    return clusterManager?.onMarkerClick(marker) ?: false
  }

  private fun tearDownClusterManager() {
    clusterManager?.clearItems()
    clusterManager?.cluster()
    clusterManager = null
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
}
