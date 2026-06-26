import MapKit

/// Annotation representing a computed cluster of markers.
///
/// Clusters are produced by `MarkerClusterEngine` on a background queue, so the
/// map view only ever receives a small, bounded number of annotations.
final class MapClusterAnnotation: NSObject, MKAnnotation {
  let id: String
  let count: Int
  let memberIds: [String]
  /// Region that frames this cluster's members, used for tap-to-zoom.
  let region: MKCoordinateRegion

  @objc dynamic var coordinate: CLLocationCoordinate2D

  init(
    id: String,
    coordinate: CLLocationCoordinate2D,
    count: Int,
    memberIds: [String],
    region: MKCoordinateRegion
  ) {
    self.id = id
    self.coordinate = coordinate
    self.count = count
    self.memberIds = memberIds
    self.region = region
  }
}
