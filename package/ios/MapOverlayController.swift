import MapKit
import UIKit

/// Reconciles overlay descriptors with MapKit annotations and overlays.
final class MapOverlayController {
  enum OverlayKind {
    case polyline
    case polygon
    case circle
  }

  struct OverlayStyle {
    let id: String
    let kind: OverlayKind
    let strokeColor: UIColor
    let fillColor: UIColor?
    let strokeWidth: CGFloat
    let tappable: Bool
  }

  private weak var mapView: MKMapView?
  private var markerAnnotations: [String: MapMarkerAnnotation] = [:]
  private var shapeOverlays: [String: MKOverlay] = [:]
  private var overlayStyles: [ObjectIdentifier: OverlayStyle] = [:]

  init(mapView: MKMapView) {
    self.mapView = mapView
  }

  func reset() {
    guard let mapView else {
      return
    }

    mapView.removeAnnotations(Array(markerAnnotations.values))
    mapView.removeOverlays(Array(shapeOverlays.values))
    markerAnnotations.removeAll()
    shapeOverlays.removeAll()
    overlayStyles.removeAll()
  }

  func updateMarkers(_ descriptors: [MarkerDescriptor]?) {
    guard let mapView else {
      return
    }

    let nextDescriptors = descriptors ?? []
    let nextIds = Set(nextDescriptors.map(\.id))
    let existingIds = Set(markerAnnotations.keys)

    for removedId in existingIds.subtracting(nextIds) {
      if let annotation = markerAnnotations.removeValue(forKey: removedId) {
        mapView.removeAnnotation(annotation)
      }
    }

    for descriptor in nextDescriptors {
      if let existing = markerAnnotations[descriptor.id] {
        existing.update(from: descriptor)
      } else {
        let annotation = MapMarkerAnnotation(descriptor: descriptor)
        markerAnnotations[descriptor.id] = annotation
        mapView.addAnnotation(annotation)
      }
    }
  }

  func updatePolylines(_ descriptors: [PolylineDescriptor]?) {
    reconcileShapeOverlays(
      descriptors ?? [],
      kind: .polyline,
      makeOverlay: { $0.toMKPolyline() },
      makeStyle: { descriptor in
        OverlayStyle(
          id: descriptor.id,
          kind: .polyline,
          strokeColor: descriptor.strokeColor?.toUIColor(fallback: .systemBlue) ?? .systemBlue,
          fillColor: nil,
          strokeWidth: CGFloat(descriptor.strokeWidth ?? 4),
          tappable: descriptor.tappable ?? false
        )
      }
    )
  }

  func updatePolygons(_ descriptors: [PolygonDescriptor]?) {
    reconcileShapeOverlays(
      descriptors ?? [],
      kind: .polygon,
      makeOverlay: { $0.toMKPolygon() },
      makeStyle: { descriptor in
        OverlayStyle(
          id: descriptor.id,
          kind: .polygon,
          strokeColor: descriptor.strokeColor?.toUIColor(fallback: .systemBlue) ?? .systemBlue,
          fillColor: descriptor.fillColor?.toUIColor(fallback: UIColor.systemBlue.withAlphaComponent(0.2))
            ?? UIColor.systemBlue.withAlphaComponent(0.2),
          strokeWidth: CGFloat(descriptor.strokeWidth ?? 2),
          tappable: descriptor.tappable ?? false
        )
      }
    )
  }

  func updateCircles(_ descriptors: [CircleDescriptor]?) {
    reconcileShapeOverlays(
      descriptors ?? [],
      kind: .circle,
      makeOverlay: { $0.toMKCircle() },
      makeStyle: { descriptor in
        OverlayStyle(
          id: descriptor.id,
          kind: .circle,
          strokeColor: descriptor.strokeColor?.toUIColor(fallback: .systemBlue) ?? .systemBlue,
          fillColor: descriptor.fillColor?.toUIColor(fallback: UIColor.systemBlue.withAlphaComponent(0.2))
            ?? UIColor.systemBlue.withAlphaComponent(0.2),
          strokeWidth: CGFloat(descriptor.strokeWidth ?? 2),
          tappable: descriptor.tappable ?? true
        )
      }
    )
  }

  func markerId(for annotation: MKAnnotation) -> String? {
    (annotation as? MapMarkerAnnotation)?.id
  }

  func markerAnnotation(for id: String) -> MapMarkerAnnotation? {
    markerAnnotations[id]
  }

  func allMarkerAnnotations() -> [MapMarkerAnnotation] {
    Array(markerAnnotations.values)
  }

  func renderer(for overlay: MKOverlay) -> MKOverlayRenderer? {
    guard let style = overlayStyles[ObjectIdentifier(overlay)] else {
      return nil
    }

    let renderer: MKOverlayPathRenderer
    switch style.kind {
    case .polyline:
      renderer = MKPolylineRenderer(overlay: overlay)
    case .polygon:
      renderer = MKPolygonRenderer(overlay: overlay)
    case .circle:
      renderer = MKCircleRenderer(overlay: overlay)
    }

    renderer.strokeColor = style.strokeColor
    renderer.lineWidth = style.strokeWidth
    if let fillColor = style.fillColor {
      renderer.fillColor = fillColor
    }

    return renderer
  }

  func overlayId(at point: CGPoint) -> String? {
    guard let mapView else {
      return nil
    }

    for overlay in mapView.overlays.reversed() {
      let overlayKey = ObjectIdentifier(overlay)
      guard let style = overlayStyles[overlayKey], style.tappable else {
        continue
      }

      guard let renderer = mapView.renderer(for: overlay) as? MKOverlayPathRenderer else {
        continue
      }

      let coordinate = mapView.convert(point, toCoordinateFrom: mapView)
      let mapPoint = MKMapPoint(coordinate)
      let rendererPoint = renderer.point(for: mapPoint)

      if renderer.path?.contains(rendererPoint) == true {
        return style.id
      }
    }

    return nil
  }

  func overlayKind(for id: String) -> OverlayKind? {
    shapeOverlays[id].flatMap { overlayStyles[ObjectIdentifier($0)]?.kind }
  }

  private func reconcileShapeOverlays<Descriptor>(
    _ descriptors: [Descriptor],
    kind: OverlayKind,
    makeOverlay: (Descriptor) -> MKOverlay,
    makeStyle: (Descriptor) -> OverlayStyle
  ) {
    guard let mapView else {
      return
    }

    let nextIds = Set(
      descriptors.compactMap { descriptor -> String? in
        let style = makeStyle(descriptor)
        return style.kind == kind ? style.id : nil
      }
    )
    let existingIds = Set(
      shapeOverlays.compactMap { id, overlay -> String? in
        overlayStyles[ObjectIdentifier(overlay)]?.kind == kind ? id : nil
      }
    )

    for removedId in existingIds.subtracting(nextIds) {
      if let overlay = shapeOverlays.removeValue(forKey: removedId) {
        overlayStyles.removeValue(forKey: ObjectIdentifier(overlay))
        mapView.removeOverlay(overlay)
      }
    }

    for descriptor in descriptors {
      let style = makeStyle(descriptor)
      guard style.kind == kind else {
        continue
      }

      if let existingOverlay = shapeOverlays[style.id] {
        overlayStyles.removeValue(forKey: ObjectIdentifier(existingOverlay))
        mapView.removeOverlay(existingOverlay)
      }

      let overlay = makeOverlay(descriptor)
      shapeOverlays[style.id] = overlay
      overlayStyles[ObjectIdentifier(overlay)] = style
      mapView.addOverlay(overlay)
    }
  }
}
