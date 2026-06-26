import NitroModules
import UIKit

protocol MapProviderAdapter: AnyObject {
  var contentView: UIView { get }

  var mapType: MapType { get set }
  var region: Region? { get set }
  var camera: Camera? { get set }
  var scrollEnabled: Bool? { get set }
  var zoomEnabled: Bool? { get set }
  var rotateEnabled: Bool? { get set }
  var pitchEnabled: Bool? { get set }
  var showsUserLocation: Bool? { get set }
  var followsUserLocation: Bool? { get set }
  var showsCompass: Bool? { get set }
  var showsScale: Bool? { get set }
  var customMapStyle: String? { get set }
  var clusteringEnabled: Bool? { get set }
  var mapPadding: EdgePadding? { get set }

  var onRegionChange: ((Region) -> Void)? { get set }
  var onRegionChangeComplete: ((Region) -> Void)? { get set }
  var onMapReady: (() -> Void)? { get set }
  var onPress: ((Coordinate) -> Void)? { get set }
  var onLongPress: ((Coordinate) -> Void)? { get set }

  var markers: [MarkerDescriptor]? { get set }
  var polylines: [PolylineDescriptor]? { get set }
  var polygons: [PolygonDescriptor]? { get set }
  var circles: [CircleDescriptor]? { get set }

  var onMarkerPress: ((String) -> Void)? { get set }
  var onMarkerDragEnd: ((String, Coordinate) -> Void)? { get set }
  var onPolylinePress: ((String) -> Void)? { get set }
  var onPolygonPress: ((String) -> Void)? { get set }
  var onCirclePress: ((String) -> Void)? { get set }
  var onClusterPress: (([String], Coordinate) -> Void)? { get set }

  func fetchCamera() throws -> Promise<Camera>
  func applyCamera(camera: Camera) throws
  func animateCamera(camera: Camera, duration: Double?) throws
  func getVisibleRegion() throws -> Promise<VisibleRegion>
  func fitToCoordinates(coordinates: [Coordinate], padding: EdgePadding?, animated: Bool?) throws
  func prepareForRecycle()
}
