package com.margelo.nitro.nitromaps

import android.Manifest
import android.content.pm.PackageManager
import android.view.View
import androidx.annotation.Keep
import androidx.core.content.ContextCompat
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.uimanager.ThemedReactContext
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.MapView
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.LatLngBounds
import com.google.android.gms.maps.model.MapStyleOptions
import com.margelo.nitro.core.Promise
import com.margelo.nitro.views.RecyclableView

@Keep
@DoNotStrip
class GoogleMapProviderAdapter(private val context: ThemedReactContext) :
  MapProviderAdapter,
  LifecycleEventListener,
  RecyclableView {

  private var googleMap: GoogleMap? = null
  private var isProgrammaticUpdate = false
  private var hasFiredMapReady = false
  private var isDestroyed = false
  private val overlayController = MapOverlayController(null, context)
  private var pendingMarkers: Array<MarkerDescriptor>? = null
  private var pendingPolylines: Array<PolylineDescriptor>? = null
  private var pendingPolygons: Array<PolygonDescriptor>? = null
  private var pendingCircles: Array<CircleDescriptor>? = null

  override val view: MapView = MapView(context).also { mapView ->
    mapView.onCreate(null)
    context.addLifecycleEventListener(this@GoogleMapProviderAdapter)

    mapView.addOnAttachStateChangeListener(
      object : View.OnAttachStateChangeListener {
        override fun onViewAttachedToWindow(v: View) {
          if (!isDestroyed) {
            mapView.onResume()
          }
        }

        override fun onViewDetachedFromWindow(v: View) {
          context.removeLifecycleEventListener(this@GoogleMapProviderAdapter)
          mapView.onPause()
          destroyMapViewIfNeeded(mapView)
        }
      },
    )

    mapView.getMapAsync { map ->
      googleMap = map
      configureMap(map)
    }
  }

  private var _mapType = MapType.STANDARD
  override var mapType: MapType
    get() = _mapType
    set(value) {
      _mapType = value
      googleMap?.mapType = value.toGoogleMapType()
    }

  private var _region: Region? = null
  override var region: Region?
    get() = _region
    set(value) {
      _region = value
      if (value != null && !isProgrammaticUpdate && _camera == null) {
        applyRegion(value)
      }
    }

  private var _camera: Camera? = null
  override var camera: Camera?
    get() = _camera
    set(value) {
      _camera = value
      if (value != null && !isProgrammaticUpdate) {
        updateMapCamera(value, animated = false)
      }
    }

  override var scrollEnabled: Boolean? = true
    set(value) {
      field = value
      applyUiSettings()
    }

  override var zoomEnabled: Boolean? = true
    set(value) {
      field = value
      applyUiSettings()
    }

  override var rotateEnabled: Boolean? = true
    set(value) {
      field = value
      applyUiSettings()
    }

  override var pitchEnabled: Boolean? = true
    set(value) {
      field = value
      applyUiSettings()
    }

  private var _showsUserLocation: Boolean? = null
  override var showsUserLocation: Boolean?
    get() = _showsUserLocation
    set(value) {
      _showsUserLocation = value
      applyUserLocationSettings()
    }

  private var _followsUserLocation: Boolean? = null
  override var followsUserLocation: Boolean?
    get() = _followsUserLocation
    set(value) {
      _followsUserLocation = value
      applyUserLocationSettings()
    }

  private var _showsCompass: Boolean? = null
  override var showsCompass: Boolean?
    get() = _showsCompass
    set(value) {
      _showsCompass = value
      applyUiSettings()
    }

  private var _showsScale: Boolean? = null
  override var showsScale: Boolean?
    get() = _showsScale
    set(value) {
      _showsScale = value
    }

  private var _customMapStyle: String? = null
  override var customMapStyle: String?
    get() = _customMapStyle
    set(value) {
      _customMapStyle = value
      applyCustomMapStyle()
    }

  private var _clusteringEnabled: Boolean? = null
  override var clusteringEnabled: Boolean?
    get() = _clusteringEnabled
    set(value) {
      _clusteringEnabled = value
      overlayController.setClusteringEnabled(value == true)
      googleMap?.let { map ->
        if (value == true) {
          map.setOnMarkerClickListener { marker ->
            overlayController.onMarkerClick(marker)
          }
        } else {
          map.setOnMarkerClickListener { marker ->
            val id = marker.tag as? String
            if (id != null) {
              onMarkerPress?.invoke(id)
            }
            false
          }
        }
      }
      overlayController.updateMarkers(_markers)
    }

  private var _mapPadding: EdgePadding? = null
  override var mapPadding: EdgePadding?
    get() = _mapPadding
    set(value) {
      _mapPadding = value
      applyMapPadding()
    }

  override var onRegionChange: ((region: Region) -> Unit)? = null
  override var onRegionChangeComplete: ((region: Region) -> Unit)? = null
  override var onMapReady: (() -> Unit)? = null
  override var onPress: ((coordinate: Coordinate) -> Unit)? = null
  override var onLongPress: ((coordinate: Coordinate) -> Unit)? = null

  private var _markers: Array<MarkerDescriptor>? = null
  override var markers: Array<MarkerDescriptor>?
    get() = _markers
    set(value) {
      _markers = value
      if (googleMap != null) {
        overlayController.updateMarkers(value)
      } else {
        pendingMarkers = value
      }
    }

  private var _polylines: Array<PolylineDescriptor>? = null
  override var polylines: Array<PolylineDescriptor>?
    get() = _polylines
    set(value) {
      _polylines = value
      if (googleMap != null) {
        overlayController.updatePolylines(value)
      } else {
        pendingPolylines = value
      }
    }

  private var _polygons: Array<PolygonDescriptor>? = null
  override var polygons: Array<PolygonDescriptor>?
    get() = _polygons
    set(value) {
      _polygons = value
      if (googleMap != null) {
        overlayController.updatePolygons(value)
      } else {
        pendingPolygons = value
      }
    }

  private var _circles: Array<CircleDescriptor>? = null
  override var circles: Array<CircleDescriptor>?
    get() = _circles
    set(value) {
      _circles = value
      if (googleMap != null) {
        overlayController.updateCircles(value)
      } else {
        pendingCircles = value
      }
    }

  override var onMarkerPress: ((id: String) -> Unit)? = null
    set(value) {
      field = value
      syncMarkerPressHandlers()
    }

  override var onMarkerDragEnd: ((id: String, coordinate: Coordinate) -> Unit)? = null
  override var onPolylinePress: ((id: String) -> Unit)? = null
  override var onPolygonPress: ((id: String) -> Unit)? = null
  override var onCirclePress: ((id: String) -> Unit)? = null

  override var onClusterPress: ((markerIds: Array<String>, coordinate: Coordinate) -> Unit)? = null
    set(value) {
      field = value
      syncMarkerPressHandlers()
    }

  override fun fetchCamera(): Promise<Camera> {
    val map = googleMap
    if (map != null) {
      return Promise.resolved(map.cameraPosition.toCamera())
    }

    return Promise.resolved(
      _camera ?: Camera(
        center = Coordinate(
          latitude = _region?.latitude ?: 0.0,
          longitude = _region?.longitude ?: 0.0,
        ),
        zoom = 10.0,
        heading = null,
        pitch = null,
        altitude = null,
      ),
    )
  }

  override fun applyCamera(camera: Camera) {
    updateMapCamera(camera, animated = false)
  }

  override fun animateCamera(camera: Camera, duration: Double?) {
    val animationDuration = duration ?: 0.25
    updateMapCamera(camera, animated = true, durationMs = (animationDuration * 1000).toInt())
  }

  override fun getVisibleRegion(): Promise<VisibleRegion> {
    val projection = googleMap?.projection
    if (projection != null) {
      return Promise.resolved(projection.toNitroVisibleRegion())
    }

    val zero = Coordinate(latitude = 0.0, longitude = 0.0)
    return Promise.resolved(
      VisibleRegion(
        nearLeft = zero,
        nearRight = zero,
        farLeft = zero,
        farRight = zero,
      ),
    )
  }

  override fun fitToCoordinates(
    coordinates: Array<Coordinate>,
    padding: EdgePadding?,
    animated: Boolean?,
  ) {
    if (coordinates.isEmpty()) {
      return
    }

    val map = googleMap ?: return
    val builder = LatLngBounds.Builder()
    for (coordinate in coordinates) {
      builder.include(LatLng(coordinate.latitude, coordinate.longitude))
    }
    val bounds = builder.build()
    val paddingPx = padding.toPaddingPixels()

    val runUpdate = {
      isProgrammaticUpdate = true
      val update = CameraUpdateFactory.newLatLngBounds(bounds, paddingPx)
      if (animated == true) {
        map.animateCamera(update)
      } else {
        map.moveCamera(update)
      }
      isProgrammaticUpdate = false
    }

    if (view.width > 0 && view.height > 0) {
      runUpdate()
    } else {
      view.post { runUpdate() }
    }
  }

  override fun onHostResume() {
    if (!isDestroyed) {
      view.onResume()
    }
  }

  override fun onHostPause() {
    if (!isDestroyed) {
      view.onPause()
    }
  }

  override fun onHostDestroy() {
    context.removeLifecycleEventListener(this)
    destroyMapViewIfNeeded(view)
  }

  private fun configureMap(map: GoogleMap) {
    map.mapType = _mapType.toGoogleMapType()
    applyUiSettings(map)
    applyUserLocationSettings(map)
    applyMapPadding(map)
    applyCustomMapStyle(map)
    overlayController.setGoogleMap(map)
    overlayController.setClusteringEnabled(_clusteringEnabled == true)
    syncMarkerPressHandlers()

    map.setOnCameraMoveListener {
      notifyRegionChange(complete = false)
    }
    map.setOnCameraIdleListener {
      if (_clusteringEnabled == true) {
        overlayController.onCameraIdle()
      }
      notifyRegionChange(complete = true)
    }
    map.setOnMapClickListener { latLng ->
      onPress?.invoke(latLng.toCoordinate())
    }
    map.setOnMapLongClickListener { latLng ->
      onLongPress?.invoke(latLng.toCoordinate())
    }
    map.setOnMapLoadedCallback {
      notifyMapReadyIfNeeded()
    }
    if (_clusteringEnabled != true) {
      map.setOnMarkerClickListener { marker ->
        val id = marker.tag as? String
        if (id != null) {
          onMarkerPress?.invoke(id)
        }
        false
      }
    } else {
      map.setOnMarkerClickListener { marker ->
        overlayController.onMarkerClick(marker)
      }
    }
    map.setOnMarkerDragListener(
      object : GoogleMap.OnMarkerDragListener {
        override fun onMarkerDragStart(marker: com.google.android.gms.maps.model.Marker) = Unit

        override fun onMarkerDrag(marker: com.google.android.gms.maps.model.Marker) = Unit

        override fun onMarkerDragEnd(marker: com.google.android.gms.maps.model.Marker) {
          val id = marker.tag as? String ?: return
          onMarkerDragEnd?.invoke(
            id,
            Coordinate(
              latitude = marker.position.latitude,
              longitude = marker.position.longitude,
            ),
          )
        }
      },
    )
    map.setOnPolylineClickListener { polyline ->
      val id = polyline.tag as? String
      if (id != null) {
        onPolylinePress?.invoke(id)
      }
    }
    map.setOnPolygonClickListener { polygon ->
      val id = polygon.tag as? String
      if (id != null) {
        onPolygonPress?.invoke(id)
      }
    }
    map.setOnCircleClickListener { circle ->
      val id = circle.tag as? String
      if (id != null) {
        onCirclePress?.invoke(id)
      }
    }

    overlayController.updateMarkers(pendingMarkers ?: _markers)
    overlayController.updatePolylines(pendingPolylines ?: _polylines)
    overlayController.updatePolygons(pendingPolygons ?: _polygons)
    overlayController.updateCircles(pendingCircles ?: _circles)
    pendingMarkers = null
    pendingPolylines = null
    pendingPolygons = null
    pendingCircles = null

    _region?.let { region ->
      if (_camera == null) {
        applyRegion(region)
      }
    }
    _camera?.let { updateMapCamera(it, animated = false) }
  }

  private fun syncMarkerPressHandlers() {
    overlayController.setMarkerPressHandlers(
      onMarkerPress = onMarkerPress,
      onClusterPress = onClusterPress?.let { callback ->
        { ids, coordinate -> callback(ids.toTypedArray(), coordinate) }
      },
    )
  }

  private fun applyUiSettings(map: GoogleMap? = googleMap) {
    map?.uiSettings?.apply {
      isScrollGesturesEnabled = scrollEnabled ?: true
      isZoomGesturesEnabled = zoomEnabled ?: true
      isRotateGesturesEnabled = rotateEnabled ?: true
      isTiltGesturesEnabled = pitchEnabled ?: true
      isCompassEnabled = _showsCompass ?: true
    }
  }

  private fun applyUserLocationSettings(map: GoogleMap? = googleMap) {
    val enabled = _showsUserLocation == true
    if (!enabled) {
      map?.isMyLocationEnabled = false
      return
    }

    val hasPermission = ContextCompat.checkSelfPermission(
      context,
      Manifest.permission.ACCESS_FINE_LOCATION,
    ) == PackageManager.PERMISSION_GRANTED

    if (hasPermission) {
      map?.isMyLocationEnabled = true
      if (_followsUserLocation == true) {
        // Google Maps does not have a direct follow mode; host apps can animate camera separately.
      }
    }
  }

  private fun applyMapPadding(map: GoogleMap? = googleMap) {
    val padding = _mapPadding
    if (padding == null) {
      map?.setPadding(0, 0, 0, 0)
      return
    }

    map?.setPadding(
      padding.left.toInt(),
      padding.top.toInt(),
      padding.right.toInt(),
      padding.bottom.toInt(),
    )
  }

  private fun applyCustomMapStyle(map: GoogleMap? = googleMap) {
    val styleJson = _customMapStyle
    if (styleJson.isNullOrEmpty()) {
      map?.setMapStyle(null)
      return
    }

    map?.setMapStyle(MapStyleOptions(styleJson))
  }

  private fun applyRegion(region: Region, animated: Boolean = false) {
    val map = googleMap ?: return
    val bounds = region.toLatLngBounds()
    val paddingPx = _mapPadding.toPaddingPixels()

    val runUpdate = {
      isProgrammaticUpdate = true
      val update = CameraUpdateFactory.newLatLngBounds(bounds, paddingPx)
      if (animated) {
        map.animateCamera(update)
      } else {
        map.moveCamera(update)
      }
      isProgrammaticUpdate = false
    }

    if (view.width > 0 && view.height > 0) {
      runUpdate()
    } else {
      view.post { runUpdate() }
    }
  }

  private fun updateMapCamera(
    camera: Camera,
    animated: Boolean,
    durationMs: Int = 0,
  ) {
    val map = googleMap ?: return
    val update = CameraUpdateFactory.newCameraPosition(
      camera.toCameraPosition(map.cameraPosition),
    )

    isProgrammaticUpdate = true
    if (animated) {
      map.animateCamera(update, durationMs, null)
    } else {
      map.moveCamera(update)
    }
    isProgrammaticUpdate = false
  }

  private fun currentRegion(): Region {
    val bounds = googleMap?.projection?.visibleRegion?.latLngBounds
    if (bounds != null) {
      return bounds.toRegion()
    }

    return _region ?: Region(
      latitude = 0.0,
      longitude = 0.0,
      latitudeDelta = 0.0,
      longitudeDelta = 0.0,
    )
  }

  private fun notifyRegionChange(complete: Boolean) {
    if (isProgrammaticUpdate) {
      return
    }

    val region = currentRegion()
    if (complete) {
      onRegionChangeComplete?.invoke(region)
    } else {
      onRegionChange?.invoke(region)
    }
  }

  private fun notifyMapReadyIfNeeded() {
    if (hasFiredMapReady) {
      return
    }

    hasFiredMapReady = true
    onMapReady?.invoke()
  }

  override fun prepareForRecycle() {
    isProgrammaticUpdate = false
    hasFiredMapReady = false
    onRegionChange = null
    onRegionChangeComplete = null
    onMapReady = null
    onPress = null
    onLongPress = null
    onMarkerPress = null
    onMarkerDragEnd = null
    onPolylinePress = null
    onPolygonPress = null
    onCirclePress = null
    onClusterPress = null
    _markers = null
    _polylines = null
    _polygons = null
    _circles = null
    pendingMarkers = null
    pendingPolylines = null
    pendingPolygons = null
    pendingCircles = null
    overlayController.clear()
    _mapType = MapType.STANDARD
    _region = null
    _camera = null
    scrollEnabled = true
    zoomEnabled = true
    rotateEnabled = true
    pitchEnabled = true
    _showsUserLocation = null
    _followsUserLocation = null
    _showsCompass = null
    _showsScale = null
    _customMapStyle = null
    _clusteringEnabled = null
    _mapPadding = null
    googleMap?.mapType = MapType.STANDARD.toGoogleMapType()
    googleMap?.isMyLocationEnabled = false
    googleMap?.setMapStyle(null)
    googleMap?.setPadding(0, 0, 0, 0)
    applyUiSettings()
  }

  private fun destroyMapViewIfNeeded(mapView: MapView) {
    if (isDestroyed) {
      return
    }

    mapView.onDestroy()
    isDestroyed = true
  }
}
