import MapKit

/// MapKit view that keeps built-in controls styled for readability on busy basemaps.
final class NitroMKMapView: MKMapView {
  override func layoutSubviews() {
    super.layoutSubviews()
    applyScaleAppearance()
  }
}
