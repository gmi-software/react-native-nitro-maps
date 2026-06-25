import MapKit

extension CircleDescriptor {
  func toMKCircle() -> MKCircle {
    MKCircle(
      center: center.toCLLocationCoordinate2D(),
      radius: radius
    )
  }
}
