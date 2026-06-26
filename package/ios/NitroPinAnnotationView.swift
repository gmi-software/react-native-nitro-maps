import MapKit
import UIKit

/// Lightweight pin view for bulk markers — avoids MKMarkerAnnotationView overhead.
final class NitroPinAnnotationView: MKAnnotationView {
  static let reuseIdentifier = "NitroPin"

  private static let pinSize = CGSize(width: 28, height: 38)
  private static let pinInset: CGFloat = 3

  /// Teardrop pin with a blue gradient (matching cluster badges), white border,
  /// inner dot and a soft shadow. Rendered once and shared across all markers.
  private static let pinImage: UIImage = {
    let size = pinSize
    let inset = pinInset
    let renderer = UIGraphicsImageRenderer(size: size)
    return renderer.image { context in
      let cg = context.cgContext
      let radius = (size.width - inset * 2) / 2
      let center = CGPoint(x: size.width / 2, y: inset + radius)
      let tip = CGPoint(x: size.width / 2, y: size.height - inset)

      let topColor = UIColor(red: 0.30, green: 0.62, blue: 1.0, alpha: 1)
      let bottomColor = UIColor(red: 0.04, green: 0.52, blue: 1.0, alpha: 1)

      let distance = tip.y - center.y
      let alpha = acos(min(1, radius / distance))
      let rightTangent = CGPoint(
        x: center.x + radius * sin(alpha),
        y: center.y + radius * cos(alpha)
      )
      let leftTangent = CGPoint(
        x: center.x - radius * sin(alpha),
        y: center.y + radius * cos(alpha)
      )

      let path = UIBezierPath()
      path.move(to: tip)
      path.addLine(to: rightTangent)
      path.addArc(
        withCenter: center,
        radius: radius,
        startAngle: atan2(rightTangent.y - center.y, rightTangent.x - center.x),
        endAngle: atan2(leftTangent.y - center.y, leftTangent.x - center.x),
        clockwise: false
      )
      path.close()

      cg.saveGState()
      cg.setShadow(
        offset: CGSize(width: 0, height: 1.5),
        blur: 3,
        color: UIColor.black.withAlphaComponent(0.3).cgColor
      )
      bottomColor.setFill()
      path.fill()
      cg.restoreGState()

      cg.saveGState()
      path.addClip()
      let space = CGColorSpaceCreateDeviceRGB()
      if let gradient = CGGradient(
        colorsSpace: space,
        colors: [topColor.cgColor, bottomColor.cgColor] as CFArray,
        locations: [0, 1]
      ) {
        cg.drawLinearGradient(
          gradient,
          start: CGPoint(x: 0, y: inset),
          end: CGPoint(x: 0, y: size.height - inset),
          options: []
        )
      }
      cg.restoreGState()

      UIColor.white.setStroke()
      path.lineWidth = 2
      path.stroke()

      let dotRadius: CGFloat = 3.6
      let dot = UIBezierPath(
        ovalIn: CGRect(
          x: center.x - dotRadius,
          y: center.y - dotRadius,
          width: dotRadius * 2,
          height: dotRadius * 2
        )
      )
      UIColor.white.setFill()
      dot.fill()
    }
  }()

  override init(annotation: MKAnnotation?, reuseIdentifier: String?) {
    super.init(annotation: annotation, reuseIdentifier: reuseIdentifier)
    image = Self.pinImage
    centerOffset = CGPoint(x: 0, y: -(Self.pinSize.height / 2 - Self.pinInset))
    collisionMode = .circle
    canShowCallout = false
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  func configure(for marker: MapMarkerAnnotation) {
    annotation = marker
    isDraggable = marker.draggable
    canShowCallout = marker.title != nil || marker.subtitle != nil
    displayPriority = .required
  }
}
