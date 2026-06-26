import MapKit
import NitroModules
import UIKit

/// iOS implementation of the `MapView` Nitro HybridView backed by MapKit.
final class HybridMapView: HybridMapViewSpec {
  private let mapViewDelegate = HybridMapViewDelegate()
  private var isProgrammaticUpdate = false
  private var hasFiredMapReady = false
  private var liveClusterTimer: Timer?
  fileprivate lazy var overlayController = MapOverlayController(mapView: view)

  lazy var view: MKMapView = {
    let mapView = NitroMKMapView()
    mapViewDelegate.parent = self
    mapView.delegate = mapViewDelegate
    mapView.mapType = mapType.toMKMapType()
    mapView.isScrollEnabled = scrollEnabled ?? true
    mapView.isZoomEnabled = zoomEnabled ?? true
    mapView.isRotateEnabled = rotateEnabled ?? true
    mapView.isPitchEnabled = pitchEnabled ?? true
    applyUserLocationSettings(to: mapView)
    applyControlSettings(to: mapView)
    applyMapPadding(to: mapView)
    applyCustomMapStyle(to: mapView)
    mapView.register(
      NitroPinAnnotationView.self,
      forAnnotationViewWithReuseIdentifier: NitroPinAnnotationView.reuseIdentifier
    )
    mapView.register(
      NitroClusterAnnotationView.self,
      forAnnotationViewWithReuseIdentifier: NitroClusterAnnotationView.reuseIdentifier
    )
    mapViewDelegate.installGestureRecognizers(on: mapView)
    return mapView
  }()

  var mapType: MapType = .standard {
    didSet {
      view.mapType = mapType.toMKMapType()
      applyCustomMapStyle(to: view)
    }
  }

  var region: Region? {
    didSet {
      guard let region, !isProgrammaticUpdate, camera == nil else {
        return
      }
      applyRegion(region)
    }
  }

  var camera: Camera? {
    didSet {
      guard let camera, !isProgrammaticUpdate else {
        return
      }
      updateMapCamera(camera, animated: false)
    }
  }

  var scrollEnabled: Bool? {
    didSet {
      view.isScrollEnabled = scrollEnabled ?? true
    }
  }

  var zoomEnabled: Bool? {
    didSet {
      view.isZoomEnabled = zoomEnabled ?? true
    }
  }

  var rotateEnabled: Bool? {
    didSet {
      view.isRotateEnabled = rotateEnabled ?? true
    }
  }

  var pitchEnabled: Bool? {
    didSet {
      view.isPitchEnabled = pitchEnabled ?? true
    }
  }

  var showsUserLocation: Bool? {
    didSet {
      applyUserLocationSettings(to: view)
    }
  }

  var followsUserLocation: Bool? {
    didSet {
      applyUserLocationSettings(to: view)
    }
  }

  var showsCompass: Bool? {
    didSet {
      applyControlSettings(to: view)
    }
  }

  var showsScale: Bool? {
    didSet {
      applyControlSettings(to: view)
    }
  }

  var customMapStyle: String? {
    didSet {
      applyCustomMapStyle(to: view)
    }
  }

  var clusteringEnabled: Bool? {
    didSet {
      overlayController.setClusteringEnabled(clusteringEnabled == true)
    }
  }

  var mapPadding: EdgePadding? {
    didSet {
      applyMapPadding(to: view)
    }
  }

  var onRegionChange: ((Region) -> Void)?
  var onRegionChangeComplete: ((Region) -> Void)?
  var onMapReady: (() -> Void)?
  var onPress: ((Coordinate) -> Void)?
  var onLongPress: ((Coordinate) -> Void)?

  var markers: [MarkerDescriptor]? {
    didSet {
      overlayController.setMarkers(markers)
    }
  }

  var polylines: [PolylineDescriptor]? {
    didSet {
      overlayController.updatePolylines(polylines)
    }
  }

  var polygons: [PolygonDescriptor]? {
    didSet {
      overlayController.updatePolygons(polygons)
    }
  }

  var circles: [CircleDescriptor]? {
    didSet {
      overlayController.updateCircles(circles)
    }
  }

  var onMarkerPress: ((String) -> Void)?
  var onMarkerDragEnd: ((String, Coordinate) -> Void)?
  var onPolylinePress: ((String) -> Void)?
  var onPolygonPress: ((String) -> Void)?
  var onCirclePress: ((String) -> Void)?
  var onClusterPress: (([String], Coordinate) -> Void)?

  func fetchCamera() throws -> Promise<Camera> {
    Promise.resolved(withResult: view.camera.toCamera())
  }

  func applyCamera(camera: Camera) throws {
    updateMapCamera(camera, animated: false)
  }

  func animateCamera(camera: Camera, duration: Double?) throws {
    let animationDuration = duration ?? 0.25
    updateMapCamera(camera, animated: true, duration: animationDuration)
  }

  func getVisibleRegion() throws -> Promise<VisibleRegion> {
    Promise.resolved(withResult: view.toVisibleRegion())
  }

  func fitToCoordinates(
    coordinates: [Coordinate],
    padding: EdgePadding?,
    animated: Bool?
  ) throws {
    guard !coordinates.isEmpty else {
      return
    }

    var mapRect = MKMapRect.null
    for coordinate in coordinates {
      let mapPoint = MKMapPoint(
        CLLocationCoordinate2D(
          latitude: coordinate.latitude,
          longitude: coordinate.longitude
        )
      )
      let pointRect = MKMapRect(x: mapPoint.x, y: mapPoint.y, width: 0, height: 0)
      mapRect = mapRect.union(pointRect)
    }

    let edgePadding = padding?.toUIEdgeInsets() ?? .zero
    isProgrammaticUpdate = true
    view.setVisibleMapRect(
      mapRect,
      edgePadding: edgePadding,
      animated: animated ?? true
    )
    isProgrammaticUpdate = false
  }

  func applyRegion(_ region: Region, animated: Bool = false) {
    isProgrammaticUpdate = true
    view.setRegion(region.toMKCoordinateRegion(), animated: animated)
    isProgrammaticUpdate = false
  }

  func updateMapCamera(_ camera: Camera, animated: Bool, duration: Double = 0) {
    isProgrammaticUpdate = true
    let mapCamera = camera.toMKMapCamera()

    if animated {
      UIView.animate(withDuration: duration) {
        self.view.camera = mapCamera
      }
    } else {
      view.camera = mapCamera
    }

    isProgrammaticUpdate = false
  }

  // Derived from MKCoordinateRegion (center + span). May differ from Android
  // bounds-derived region when the map is rotated or pitched.
  func currentRegion() -> Region {
    view.region.toRegion()
  }

  func scheduleMarkerViewportRefresh() {
    overlayController.scheduleViewportRefresh()
  }

  func animateToClusterRegion(_ region: MKCoordinateRegion) {
    view.setRegion(view.regionThatFits(region), animated: true)
  }

  /// Recomputes clusters live (throttled) while the user is interacting.
  func startLiveClustering() {
    guard liveClusterTimer == nil else {
      return
    }
    let timer = Timer(timeInterval: 0.1, repeats: true) { [weak self] _ in
      self?.overlayController.refreshNow()
    }
    RunLoop.main.add(timer, forMode: .common)
    liveClusterTimer = timer
  }

  func stopLiveClustering() {
    liveClusterTimer?.invalidate()
    liveClusterTimer = nil
    overlayController.scheduleViewportRefresh(immediate: true)
  }

  func notifyRegionChange(complete: Bool) {
    guard !isProgrammaticUpdate else {
      return
    }

    let region = currentRegion()
    if complete {
      onRegionChangeComplete?(region)
    } else {
      onRegionChange?(region)
    }
  }

  func notifyMapReadyIfNeeded() {
    guard !hasFiredMapReady else {
      return
    }

    hasFiredMapReady = true
    overlayController.setMarkers(markers)
    onMapReady?()
  }

  func notifyPress(at point: CGPoint) {
    let coordinate = view.convert(point, toCoordinateFrom: view)
    onPress?(Coordinate(latitude: coordinate.latitude, longitude: coordinate.longitude))
  }

  func notifyLongPress(at point: CGPoint) {
    let coordinate = view.convert(point, toCoordinateFrom: view)
    onLongPress?(Coordinate(latitude: coordinate.latitude, longitude: coordinate.longitude))
  }

  func notifyOverlayPress(at point: CGPoint) -> Bool {
    guard let overlayId = overlayController.overlayId(at: point) else {
      return false
    }

    switch overlayController.overlayKind(for: overlayId) {
    case .polyline:
      onPolylinePress?(overlayId)
    case .polygon:
      onPolygonPress?(overlayId)
    case .circle:
      onCirclePress?(overlayId)
    case .none:
      return false
    }

    return true
  }

  func renderer(for overlay: MKOverlay) -> MKOverlayRenderer? {
    overlayController.renderer(for: overlay)
  }

  func prepareForRecycle() {
    liveClusterTimer?.invalidate()
    liveClusterTimer = nil
    isProgrammaticUpdate = false
    hasFiredMapReady = false
    onRegionChange = nil
    onRegionChangeComplete = nil
    onMapReady = nil
    onPress = nil
    onLongPress = nil
    onMarkerPress = nil
    onMarkerDragEnd = nil
    onPolylinePress = nil
    onPolygonPress = nil
    onCirclePress = nil
    onClusterPress = nil
    markers = nil
    polylines = nil
    polygons = nil
    circles = nil
    overlayController.reset()
    mapType = .standard
    region = nil
    camera = nil
    scrollEnabled = nil
    zoomEnabled = nil
    rotateEnabled = nil
    pitchEnabled = nil
    showsUserLocation = nil
    followsUserLocation = nil
    showsCompass = nil
    showsScale = nil
    customMapStyle = nil
    clusteringEnabled = nil
    mapPadding = nil
    view.mapType = .standard
    view.isScrollEnabled = true
    view.isZoomEnabled = true
    view.isRotateEnabled = true
    view.isPitchEnabled = true
    view.showsUserLocation = false
    view.userTrackingMode = .none
    view.showsCompass = true
    view.showsScale = false
    view.layoutMargins = .zero
    if #available(iOS 16.0, *) {
      view.preferredConfiguration = MapType.standard.toMKMapConfiguration()
    }
  }

  private func applyUserLocationSettings(to mapView: MKMapView) {
    mapView.showsUserLocation = showsUserLocation ?? false
    if followsUserLocation == true, showsUserLocation == true {
      mapView.userTrackingMode = .follow
    } else {
      mapView.userTrackingMode = .none
    }
  }

  private func applyControlSettings(to mapView: MKMapView) {
    mapView.showsCompass = showsCompass ?? true
    mapView.showsScale = showsScale ?? false
    mapView.applyScaleAppearance()
  }

  private func applyMapPadding(to mapView: MKMapView) {
    let insets = mapPadding?.toUIEdgeInsets() ?? .zero
    mapView.layoutMargins = insets
  }

  private func applyCustomMapStyle(to mapView: MKMapView) {
    if #available(iOS 16.0, *) {
      CustomMapStyleParser.apply(json: customMapStyle, mapType: mapType, to: mapView)
    }
  }
}

extension HybridMapView: RecyclableView {}
