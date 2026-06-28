import NitroModules
import UIKit

final class HybridMapView: HybridMapViewSpec {
  private let containerView = UIView()
  private var adapter: MapProviderAdapter?

  private var _provider: MapProvider = .apple
  private var _mapType: MapType = .standard
  private var _region: Region?
  private var _camera: Camera?
  private var _scrollEnabled: Bool?
  private var _zoomEnabled: Bool?
  private var _rotateEnabled: Bool?
  private var _pitchEnabled: Bool?
  private var _showsUserLocation: Bool?
  private var _followsUserLocation: Bool?
  private var _showsCompass: Bool?
  private var _showsScale: Bool?
  private var _customMapStyle: String?
  private var _googleMapId: String?
  private var _clusteringEnabled: Bool?
  private var _mapPadding: EdgePadding?
  private var _markerEnteringAnimation: OverlayEnteringAnimationDescriptor?
  private var _clusterEnteringAnimation: OverlayEnteringAnimationDescriptor?

  lazy var view: UIView = {
    containerView
  }()

  var provider: MapProvider? {
    get { _provider }
    set {
      let nextProvider = newValue ?? .apple
      guard nextProvider != _provider || adapter == nil else {
        return
      }

      _provider = nextProvider
      installAdapter(for: nextProvider)
    }
  }

  var mapType: MapType {
    get { _mapType }
    set {
      _mapType = newValue
      adapter?.mapType = newValue
    }
  }

  var region: Region? {
    get { _region }
    set {
      _region = newValue
      adapter?.region = newValue
    }
  }

  var camera: Camera? {
    get { _camera }
    set {
      _camera = newValue
      adapter?.camera = newValue
    }
  }

  var scrollEnabled: Bool? {
    get { _scrollEnabled }
    set {
      _scrollEnabled = newValue
      adapter?.scrollEnabled = newValue
    }
  }

  var zoomEnabled: Bool? {
    get { _zoomEnabled }
    set {
      _zoomEnabled = newValue
      adapter?.zoomEnabled = newValue
    }
  }

  var rotateEnabled: Bool? {
    get { _rotateEnabled }
    set {
      _rotateEnabled = newValue
      adapter?.rotateEnabled = newValue
    }
  }

  var pitchEnabled: Bool? {
    get { _pitchEnabled }
    set {
      _pitchEnabled = newValue
      adapter?.pitchEnabled = newValue
    }
  }

  var showsUserLocation: Bool? {
    get { _showsUserLocation }
    set {
      _showsUserLocation = newValue
      adapter?.showsUserLocation = newValue
    }
  }

  var followsUserLocation: Bool? {
    get { _followsUserLocation }
    set {
      _followsUserLocation = newValue
      adapter?.followsUserLocation = newValue
    }
  }

  var showsCompass: Bool? {
    get { _showsCompass }
    set {
      _showsCompass = newValue
      adapter?.showsCompass = newValue
    }
  }

  var showsScale: Bool? {
    get { _showsScale }
    set {
      _showsScale = newValue
      adapter?.showsScale = newValue
    }
  }

  var customMapStyle: String? {
    get { _customMapStyle }
    set {
      _customMapStyle = newValue
      adapter?.customMapStyle = newValue
    }
  }

  var googleMapId: String? {
    get { _googleMapId }
    set {
      guard _googleMapId != newValue else {
        return
      }

      _googleMapId = newValue
      if _provider == .google, adapter != nil {
        installAdapter(for: _provider)
      }
    }
  }

  var clusteringEnabled: Bool? {
    get { _clusteringEnabled }
    set {
      _clusteringEnabled = newValue
      adapter?.clusteringEnabled = newValue
    }
  }

  var mapPadding: EdgePadding? {
    get { _mapPadding }
    set {
      _mapPadding = newValue
      adapter?.mapPadding = newValue
    }
  }

  var markerEnteringAnimation: OverlayEnteringAnimationDescriptor? {
    get { _markerEnteringAnimation }
    set {
      _markerEnteringAnimation = newValue
      adapter?.markerEnteringAnimation = newValue
    }
  }

  var clusterEnteringAnimation: OverlayEnteringAnimationDescriptor? {
    get { _clusterEnteringAnimation }
    set {
      _clusterEnteringAnimation = newValue
      adapter?.clusterEnteringAnimation = newValue
    }
  }

  var onRegionChange: ((Region) -> Void)? {
    didSet { adapter?.onRegionChange = onRegionChange }
  }

  var onRegionChangeComplete: ((Region) -> Void)? {
    didSet { adapter?.onRegionChangeComplete = onRegionChangeComplete }
  }

  var onMapReady: (() -> Void)? {
    didSet { adapter?.onMapReady = onMapReady }
  }

  var onPress: ((Coordinate) -> Void)? {
    didSet { adapter?.onPress = onPress }
  }

  var onLongPress: ((Coordinate) -> Void)? {
    didSet { adapter?.onLongPress = onLongPress }
  }

  var markers: [MarkerDescriptor]? {
    didSet { adapter?.markers = markers }
  }

  var polylines: [PolylineDescriptor]? {
    didSet { adapter?.polylines = polylines }
  }

  var polygons: [PolygonDescriptor]? {
    didSet { adapter?.polygons = polygons }
  }

  var circles: [CircleDescriptor]? {
    didSet { adapter?.circles = circles }
  }

  var onMarkerPress: ((String) -> Void)? {
    didSet { adapter?.onMarkerPress = onMarkerPress }
  }

  var onMarkerDragEnd: ((String, Coordinate) -> Void)? {
    didSet { adapter?.onMarkerDragEnd = onMarkerDragEnd }
  }

  var onPolylinePress: ((String) -> Void)? {
    didSet { adapter?.onPolylinePress = onPolylinePress }
  }

  var onPolygonPress: ((String) -> Void)? {
    didSet { adapter?.onPolygonPress = onPolygonPress }
  }

  var onCirclePress: ((String) -> Void)? {
    didSet { adapter?.onCirclePress = onCirclePress }
  }

  var onClusterPress: (([String], Coordinate) -> Void)? {
    didSet { adapter?.onClusterPress = onClusterPress }
  }

  func fetchCamera() throws -> Promise<Camera> {
    try currentAdapter().fetchCamera()
  }

  func applyCamera(camera: Camera) throws {
    try currentAdapter().applyCamera(camera: camera)
  }

  func animateCamera(camera: Camera, duration: Double?) throws {
    try currentAdapter().animateCamera(camera: camera, duration: duration)
  }

  func getVisibleRegion() throws -> Promise<VisibleRegion> {
    try currentAdapter().getVisibleRegion()
  }

  func fitToCoordinates(
    coordinates: [Coordinate],
    padding: EdgePadding?,
    animated: Bool?
  ) throws {
    try currentAdapter().fitToCoordinates(
      coordinates: coordinates,
      padding: padding,
      animated: animated
    )
  }

  func prepareForRecycle() {
    adapter?.prepareForRecycle()
    adapter?.contentView.removeFromSuperview()
    adapter = nil
    _provider = .apple
    _mapType = .standard
    _region = nil
    _camera = nil
    _scrollEnabled = nil
    _zoomEnabled = nil
    _rotateEnabled = nil
    _pitchEnabled = nil
    _showsUserLocation = nil
    _followsUserLocation = nil
    _showsCompass = nil
    _showsScale = nil
    _customMapStyle = nil
    _googleMapId = nil
    _clusteringEnabled = nil
    _mapPadding = nil
    _markerEnteringAnimation = nil
    _clusterEnteringAnimation = nil
    markers = nil
    polylines = nil
    polygons = nil
    circles = nil
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
  }

  private func currentAdapter() throws -> MapProviderAdapter {
    if let adapter {
      return adapter
    }

    installAdapter(for: _provider)
    return adapter!
  }

  private func installAdapter(for provider: MapProvider) {
    adapter?.prepareForRecycle()
    adapter?.contentView.removeFromSuperview()

    let nextAdapter = makeAdapter(for: provider)
    adapter = nextAdapter
    attach(contentView: nextAdapter.contentView)
    syncState(to: nextAdapter)
  }

  private func makeAdapter(for provider: MapProvider) -> MapProviderAdapter {
    switch provider {
    case .apple:
      return AppleMapProviderAdapter()
    case .google:
      return GoogleMapProviderAdapter(googleMapId: _googleMapId)
    case .openstreetmap, .mapbox:
      preconditionFailure("Map provider \"\(provider)\" is not supported on iOS.")
    }
  }

  private func attach(contentView: UIView) {
    contentView.translatesAutoresizingMaskIntoConstraints = false
    containerView.addSubview(contentView)
    NSLayoutConstraint.activate([
      contentView.leadingAnchor.constraint(equalTo: containerView.leadingAnchor),
      contentView.trailingAnchor.constraint(equalTo: containerView.trailingAnchor),
      contentView.topAnchor.constraint(equalTo: containerView.topAnchor),
      contentView.bottomAnchor.constraint(equalTo: containerView.bottomAnchor),
    ])
  }

  private func syncState(to adapter: MapProviderAdapter) {
    adapter.mapType = _mapType
    adapter.region = _region
    adapter.camera = _camera
    adapter.scrollEnabled = _scrollEnabled
    adapter.zoomEnabled = _zoomEnabled
    adapter.rotateEnabled = _rotateEnabled
    adapter.pitchEnabled = _pitchEnabled
    adapter.showsUserLocation = _showsUserLocation
    adapter.followsUserLocation = _followsUserLocation
    adapter.showsCompass = _showsCompass
    adapter.showsScale = _showsScale
    adapter.customMapStyle = _customMapStyle
    adapter.googleMapId = _googleMapId
    adapter.clusteringEnabled = _clusteringEnabled
    adapter.mapPadding = _mapPadding
    adapter.markerEnteringAnimation = _markerEnteringAnimation
    adapter.clusterEnteringAnimation = _clusterEnteringAnimation
    adapter.onRegionChange = onRegionChange
    adapter.onRegionChangeComplete = onRegionChangeComplete
    adapter.onMapReady = onMapReady
    adapter.onPress = onPress
    adapter.onLongPress = onLongPress
    adapter.markers = markers
    adapter.polylines = polylines
    adapter.polygons = polygons
    adapter.circles = circles
    adapter.onMarkerPress = onMarkerPress
    adapter.onMarkerDragEnd = onMarkerDragEnd
    adapter.onPolylinePress = onPolylinePress
    adapter.onPolygonPress = onPolygonPress
    adapter.onCirclePress = onCirclePress
    adapter.onClusterPress = onClusterPress
  }
}

extension HybridMapView: RecyclableView {}
