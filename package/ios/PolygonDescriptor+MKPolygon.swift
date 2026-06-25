import MapKit

extension PolygonDescriptor {
  func toMKPolygon() -> MKPolygon {
    let coordinates = coordinates.toCLLocationCoordinates()
    return MKPolygon(coordinates: coordinates, count: coordinates.count)
  }
}
