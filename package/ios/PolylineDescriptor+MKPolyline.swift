import MapKit

extension PolylineDescriptor {
  func toMKPolyline() -> MKPolyline {
    let coordinates = coordinates.toCLLocationCoordinates()
    return MKPolyline(coordinates: coordinates, count: coordinates.count)
  }
}
