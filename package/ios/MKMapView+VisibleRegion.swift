import MapKit

extension MKMapView {
  func toVisibleRegion() -> VisibleRegion {
    let bounds = self.bounds
    let nearLeftPoint = CGPoint(x: bounds.minX, y: bounds.maxY)
    let nearRightPoint = CGPoint(x: bounds.maxX, y: bounds.maxY)
    let farLeftPoint = CGPoint(x: bounds.minX, y: bounds.minY)
    let farRightPoint = CGPoint(x: bounds.maxX, y: bounds.minY)

    func coordinate(for point: CGPoint) -> Coordinate {
      let mapPoint = convert(point, toCoordinateFrom: self)
      return Coordinate(latitude: mapPoint.latitude, longitude: mapPoint.longitude)
    }

    return VisibleRegion(
      nearLeft: coordinate(for: nearLeftPoint),
      nearRight: coordinate(for: nearRightPoint),
      farLeft: coordinate(for: farLeftPoint),
      farRight: coordinate(for: farRightPoint)
    )
  }
}
