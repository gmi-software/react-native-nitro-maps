import MapKit
import UIKit

/// Native MapKit marker view with system insertion animation, selection bounce, and styling.
final class NitroPinAnnotationView: MKMarkerAnnotationView {
  static let reuseIdentifier = "NitroPin"

  override init(annotation: MKAnnotation?, reuseIdentifier: String?) {
    super.init(annotation: annotation, reuseIdentifier: reuseIdentifier)
    animatesWhenAdded = true
    canShowCallout = false
    collisionMode = .circle
    displayPriority = .required
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  func configure(for marker: MapMarkerAnnotation) {
    layer.removeAllAnimations()
    alpha = 1
    transform = .identity
    annotation = marker
    animatesWhenAdded = marker.enteringAnimation.kind == .system
    isDraggable = marker.draggable
    canShowCallout = marker.title != nil || marker.subtitle != nil
    displayPriority = .required
  }
}
