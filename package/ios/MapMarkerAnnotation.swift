import MapKit

/// MapKit annotation backed by a marker descriptor.
final class MapMarkerAnnotation: NSObject, MKAnnotation {
  let id: String
  let draggable: Bool
  let isClusterable: Bool

  @objc dynamic var coordinate: CLLocationCoordinate2D
  @objc dynamic var title: String?
  @objc dynamic var subtitle: String?

  init(descriptor: MarkerDescriptor) {
    id = descriptor.id
    coordinate = CLLocationCoordinate2D(
      latitude: descriptor.coordinate.latitude,
      longitude: descriptor.coordinate.longitude
    )
    title = descriptor.title
    subtitle = descriptor.subtitle
    draggable = descriptor.draggable ?? false
    isClusterable = descriptor.clusterable ?? true
  }

  func update(from descriptor: MarkerDescriptor) {
    coordinate = CLLocationCoordinate2D(
      latitude: descriptor.coordinate.latitude,
      longitude: descriptor.coordinate.longitude
    )
    title = descriptor.title
    subtitle = descriptor.subtitle
  }
}
