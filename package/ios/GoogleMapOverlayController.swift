import GoogleMaps
import MapKit
import UIKit

final class GoogleMapOverlayController {
  private enum MarkerPayload {
    case marker(String)
    case cluster(memberIds: [String], region: MKCoordinateRegion)
  }

  private enum ShapeKind {
    case polyline
    case polygon
    case circle
  }

  private static let asyncThreshold = 500

  private weak var mapView: GMSMapView?
  private var markers: [String: GMSMarker] = [:]
  private var polylines: [String: GMSPolyline] = [:]
  private var polygons: [String: GMSPolygon] = [:]
  private var circles: [String: GMSCircle] = [:]
  private var allMarkerDescriptors: [MarkerDescriptor] = []
  private var markersFingerprint = 0
  private var spatialIndex: MarkerSpatialIndex?
  private var clusteringEnabled = false

  var onMarkerPress: ((String) -> Void)?
  var onMarkerDragEnd: ((String, Coordinate) -> Void)?
  var onPolylinePress: ((String) -> Void)?
  var onPolygonPress: ((String) -> Void)?
  var onCirclePress: ((String) -> Void)?
  var onClusterPress: (([String], Coordinate) -> Void)?
  var animateToClusterRegion: ((MKCoordinateRegion) -> Void)?

  init(mapView: GMSMapView) {
    self.mapView = mapView
  }

  private var usesViewportPipeline: Bool {
    clusteringEnabled || allMarkerDescriptors.count > Self.asyncThreshold
  }

  func reset() {
    clearMarkers()
    clearShapes()
    allMarkerDescriptors.removeAll()
    markersFingerprint = 0
    spatialIndex = nil
  }

  func setClusteringEnabled(_ enabled: Bool) {
    guard clusteringEnabled != enabled else {
      return
    }

    clusteringEnabled = enabled
    reapplyMarkers()
  }

  func setMarkers(_ descriptors: [MarkerDescriptor]?) {
    let next = descriptors ?? []
    let fingerprint = MarkerViewportFilter.markersFingerprint(next)
    guard fingerprint != markersFingerprint else {
      return
    }

    markersFingerprint = fingerprint
    allMarkerDescriptors = next
    spatialIndex = nil
    reapplyMarkers()
  }

  func refreshViewportMarkers() {
    guard let mapView, let index = spatialIndex, usesViewportPipeline else {
      return
    }

    let region = mapView.currentNitroRegion().toMKCoordinateRegion()
    let candidates = index.candidates(in: region)
    let elements: [MarkerClusterEngine.Element]
    if clusteringEnabled {
      elements = MarkerClusterEngine.clusters(
        candidates: candidates,
        region: region,
        viewSize: mapView.bounds.size
      )
    } else {
      elements = MarkerViewportFilter
        .displaySubset(candidates: candidates, region: region)
        .map { .single($0) }
    }
    reconcileMarkerElements(elements)
  }

  func handleMarkerTap(_ marker: GMSMarker) -> Bool {
    switch marker.userData as? MarkerPayload {
    case let .marker(id):
      onMarkerPress?(id)
      return marker.title == nil && marker.snippet == nil
    case let .cluster(memberIds, region):
      onClusterPress?(
        memberIds,
        Coordinate(latitude: marker.position.latitude, longitude: marker.position.longitude)
      )
      animateToClusterRegion?(region)
      return true
    case .none:
      return false
    }
  }

  func handleMarkerDragEnd(_ marker: GMSMarker) {
    guard case let .marker(id) = marker.userData as? MarkerPayload else {
      return
    }

    onMarkerDragEnd?(
      id,
      Coordinate(latitude: marker.position.latitude, longitude: marker.position.longitude)
    )
  }

  func handleOverlayTap(_ overlay: GMSOverlay) {
    guard let id = overlay.userData as? String else {
      return
    }

    if overlay is GMSPolyline {
      onPolylinePress?(id)
    } else if overlay is GMSPolygon {
      onPolygonPress?(id)
    } else if overlay is GMSCircle {
      onCirclePress?(id)
    }
  }

  func updatePolylines(_ descriptors: [PolylineDescriptor]?) {
    reconcile(
      current: &polylines,
      next: descriptors ?? [],
      make: makePolyline,
      update: updatePolyline
    )
  }

  func updatePolygons(_ descriptors: [PolygonDescriptor]?) {
    reconcile(
      current: &polygons,
      next: descriptors ?? [],
      make: makePolygon,
      update: updatePolygon
    )
  }

  func updateCircles(_ descriptors: [CircleDescriptor]?) {
    reconcile(
      current: &circles,
      next: descriptors ?? [],
      make: makeCircle,
      update: updateCircle
    )
  }

  private func reapplyMarkers() {
    if usesViewportPipeline {
      spatialIndex = MarkerSpatialIndex(markers: allMarkerDescriptors)
      refreshViewportMarkers()
    } else {
      spatialIndex = nil
      reconcileMarkerElements(allMarkerDescriptors.map { .single($0) })
    }
  }

  private func reconcileMarkerElements(_ elements: [MarkerClusterEngine.Element]) {
    guard let mapView else {
      return
    }

    var nextKeys = Set<String>()
    for element in elements {
      let key = element.diffKey
      nextKeys.insert(key)
      if let marker = markers[key] {
        updateMarker(marker, with: element)
      } else {
        let marker = makeMarker(for: element)
        marker.map = mapView
        markers[key] = marker
      }
    }

    for key in Set(markers.keys).subtracting(nextKeys) {
      markers.removeValue(forKey: key)?.map = nil
    }
  }

  private func makeMarker(for element: MarkerClusterEngine.Element) -> GMSMarker {
    let marker = GMSMarker()
    updateMarker(marker, with: element)
    return marker
  }

  private func updateMarker(_ marker: GMSMarker, with element: MarkerClusterEngine.Element) {
    switch element {
    case let .single(descriptor):
      marker.position = descriptor.coordinate.toCLLocationCoordinate2D()
      marker.title = descriptor.title
      marker.snippet = descriptor.subtitle
      marker.isDraggable = descriptor.draggable == true
      marker.icon = nil
      marker.groundAnchor = CGPoint(x: 0.5, y: 1)
      marker.userData = MarkerPayload.marker(descriptor.id)
    case let .cluster(_, coordinate, count, memberIds, region):
      marker.position = coordinate
      marker.title = nil
      marker.snippet = nil
      marker.isDraggable = false
      marker.icon = Self.clusterIcon(count: count)
      marker.groundAnchor = CGPoint(x: 0.5, y: 0.5)
      marker.userData = MarkerPayload.cluster(memberIds: memberIds, region: region)
    }
  }

  private static func clusterIcon(count: Int) -> UIImage {
    let diameter = ClusterBadgeMetrics.diameter(for: count)
    let format = UIGraphicsImageRendererFormat.default()
    format.scale = UIScreen.main.scale
    return UIGraphicsImageRenderer(size: CGSize(width: diameter, height: diameter), format: format)
      .image { context in
        let rect = CGRect(x: 0, y: 0, width: diameter, height: diameter)
        let colors = [
          UIColor(red: 0.30, green: 0.62, blue: 1.0, alpha: 1).cgColor,
          UIColor(red: 0.04, green: 0.52, blue: 1.0, alpha: 1).cgColor,
        ] as CFArray
        let colorSpace = CGColorSpaceCreateDeviceRGB()
        let gradient = CGGradient(colorsSpace: colorSpace, colors: colors, locations: [0, 1])!
        context.cgContext.addEllipse(in: rect.insetBy(dx: 1, dy: 1))
        context.cgContext.clip()
        context.cgContext.drawLinearGradient(
          gradient,
          start: CGPoint(x: diameter / 2, y: 0),
          end: CGPoint(x: diameter / 2, y: diameter),
          options: []
        )
        context.cgContext.resetClip()
        UIColor.white.setStroke()
        let borderPath = UIBezierPath(ovalIn: rect.insetBy(dx: 1, dy: 1))
        borderPath.lineWidth = 2
        borderPath.stroke()

        let text = count >= 1000 ? String(format: "%.1fk", Double(count) / 1000) : String(count)
        let attributes: [NSAttributedString.Key: Any] = [
          .font: UIFont.systemFont(ofSize: 13, weight: .bold),
          .foregroundColor: UIColor.white,
        ]
        let textSize = text.size(withAttributes: attributes)
        text.draw(
          at: CGPoint(x: (diameter - textSize.width) / 2, y: (diameter - textSize.height) / 2),
          withAttributes: attributes
        )
      }
  }

  private func clearMarkers() {
    for marker in markers.values {
      marker.map = nil
    }
    markers.removeAll()
  }

  private func clearShapes() {
    for overlay in polylines.values {
      overlay.map = nil
    }
    for overlay in polygons.values {
      overlay.map = nil
    }
    for overlay in circles.values {
      overlay.map = nil
    }
    polylines.removeAll()
    polygons.removeAll()
    circles.removeAll()
  }

  private func makePolyline(_ descriptor: PolylineDescriptor) -> GMSPolyline {
    let polyline = GMSPolyline(path: descriptor.coordinates.toGMSPath())
    updatePolyline(polyline, descriptor)
    return polyline
  }

  private func updatePolyline(_ polyline: GMSPolyline, _ descriptor: PolylineDescriptor) {
    polyline.path = descriptor.coordinates.toGMSPath()
    polyline.strokeColor = descriptor.strokeColor?.toUIColor(fallback: .systemBlue) ?? .systemBlue
    polyline.strokeWidth = CGFloat(descriptor.strokeWidth ?? 4)
    polyline.isTappable = descriptor.tappable ?? false
    polyline.userData = descriptor.id
  }

  private func makePolygon(_ descriptor: PolygonDescriptor) -> GMSPolygon {
    let polygon = GMSPolygon(path: descriptor.coordinates.toGMSPath())
    updatePolygon(polygon, descriptor)
    return polygon
  }

  private func updatePolygon(_ polygon: GMSPolygon, _ descriptor: PolygonDescriptor) {
    polygon.path = descriptor.coordinates.toGMSPath()
    polygon.strokeColor = descriptor.strokeColor?.toUIColor(fallback: .systemBlue) ?? .systemBlue
    polygon.fillColor = descriptor.fillColor?.toUIColor(
      fallback: UIColor.systemBlue.withAlphaComponent(0.2)
    ) ?? UIColor.systemBlue.withAlphaComponent(0.2)
    polygon.strokeWidth = CGFloat(descriptor.strokeWidth ?? 2)
    polygon.isTappable = descriptor.tappable ?? false
    polygon.userData = descriptor.id
  }

  private func makeCircle(_ descriptor: CircleDescriptor) -> GMSCircle {
    let circle = GMSCircle(
      position: descriptor.center.toCLLocationCoordinate2D(),
      radius: descriptor.radius
    )
    updateCircle(circle, descriptor)
    return circle
  }

  private func updateCircle(_ circle: GMSCircle, _ descriptor: CircleDescriptor) {
    circle.position = descriptor.center.toCLLocationCoordinate2D()
    circle.radius = descriptor.radius
    circle.strokeColor = descriptor.strokeColor?.toUIColor(fallback: .systemBlue) ?? .systemBlue
    circle.fillColor = descriptor.fillColor?.toUIColor(
      fallback: UIColor.systemBlue.withAlphaComponent(0.2)
    ) ?? UIColor.systemBlue.withAlphaComponent(0.2)
    circle.strokeWidth = CGFloat(descriptor.strokeWidth ?? 2)
    circle.isTappable = descriptor.tappable ?? true
    circle.userData = descriptor.id
  }

  private func reconcile<Descriptor, Overlay: GMSOverlay>(
    current: inout [String: Overlay],
    next descriptors: [Descriptor],
    make: (Descriptor) -> Overlay,
    update: (Overlay, Descriptor) -> Void
  ) where Descriptor: IdentifiedOverlayDescriptor {
    guard let mapView else {
      return
    }

    var nextIds = Set<String>()
    for descriptor in descriptors {
      nextIds.insert(descriptor.id)
      if let overlay = current[descriptor.id] {
        update(overlay, descriptor)
      } else {
        let overlay = make(descriptor)
        overlay.map = mapView
        current[descriptor.id] = overlay
      }
    }

    for id in Set(current.keys).subtracting(nextIds) {
      current.removeValue(forKey: id)?.map = nil
    }
  }
}

private protocol IdentifiedOverlayDescriptor {
  var id: String { get }
}

extension PolylineDescriptor: IdentifiedOverlayDescriptor {}
extension PolygonDescriptor: IdentifiedOverlayDescriptor {}
extension CircleDescriptor: IdentifiedOverlayDescriptor {}

private extension Array where Element == Coordinate {
  func toGMSPath() -> GMSPath {
    let path = GMSMutablePath()
    for coordinate in self {
      path.add(coordinate.toCLLocationCoordinate2D())
    }
    return path
  }
}
