import CoreLocation

extension Coordinate {
  func toCLLocationCoordinate2D() -> CLLocationCoordinate2D {
    CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
  }
}

extension Array where Element == Coordinate {
  func toCLLocationCoordinates() -> [CLLocationCoordinate2D] {
    map { $0.toCLLocationCoordinate2D() }
  }
}
