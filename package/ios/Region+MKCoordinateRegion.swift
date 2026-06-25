import MapKit

extension Region {
  func toMKCoordinateRegion() -> MKCoordinateRegion {
    MKCoordinateRegion(
      center: CLLocationCoordinate2D(latitude: latitude, longitude: longitude),
      span: MKCoordinateSpan(latitudeDelta: latitudeDelta, longitudeDelta: longitudeDelta)
    )
  }
}

extension MKCoordinateRegion {
  func toRegion() -> Region {
    Region(
      latitude: center.latitude,
      longitude: center.longitude,
      latitudeDelta: span.latitudeDelta,
      longitudeDelta: span.longitudeDelta
    )
  }
}
