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

  /// Datasets at or below this size (non-clustered) reconcile synchronously on
  /// the main thread; everything else offloads compute to `computeQueue`.
  private static let asyncThreshold = 500

  private weak var mapView: MKMapView?
  /// All currently shown annotations (singles and clusters), keyed by diff key.
  private var displayedAnnotations: [String: MKAnnotation] = [:]
  private var allMarkerDescriptors: [MarkerDescriptor] = []
  private var spatialIndex: MarkerSpatialIndex?
  private var shapeOverlays: [String: MKOverlay] = [:]
  private var overlayStyles: [ObjectIdentifier: OverlayStyle] = [:]
  private var viewportRefreshWorkItem: DispatchWorkItem?
  private var markersFingerprint: Int = 0
  private var refreshGeneration: Int = 0
  private var clusteringEnabled = false
  private let computeQueue = DispatchQueue(
    label: "com.nitromaps.markerCompute",
    qos: .userInitiated
  )

  init(mapView: MKMapView) {
    self.mapView = mapView
  }

  /// Whether markers are driven by the background viewport pipeline (clustering
  /// or large LOD) rather than the synchronous small-dataset path.
  private var usesViewportPipeline: Bool {
    clusteringEnabled || allMarkerDescriptors.count > Self.asyncThreshold
  }

  func setClusteringEnabled(_ enabled: Bool) {
    guard clusteringEnabled != enabled else {
      return
    }

    clusteringEnabled = enabled
    reapplyMarkers()
  }

  func reset() {
    viewportRefreshWorkItem?.cancel()
    viewportRefreshWorkItem = nil
    refreshGeneration += 1
    guard let mapView else {
      return
    }

    mapView.removeAnnotations(Array(displayedAnnotations.values))
    mapView.removeOverlays(Array(shapeOverlays.values))
    displayedAnnotations.removeAll()
    allMarkerDescriptors.removeAll()
    spatialIndex = nil
    shapeOverlays.removeAll()
    overlayStyles.removeAll()
    markersFingerprint = 0
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

  private func reapplyMarkers() {
    if usesViewportPipeline {
      rebuildIndexAndRefresh()
    } else {
      reconcileMarkersSync(allMarkerDescriptors)
    }
  }

  /// Immediate (non-debounced) refresh used for live updates during gestures.
  func refreshNow() {
    guard usesViewportPipeline else {
      return
    }
    refreshViewportMarkers()
  }

  /// Debounced viewport refresh for clustered / large datasets.
  func scheduleViewportRefresh(immediate: Bool = false) {
    guard usesViewportPipeline else {
      return
    }

    viewportRefreshWorkItem?.cancel()
    let work = DispatchWorkItem { [weak self] in
      self?.refreshViewportMarkers()
    }
    viewportRefreshWorkItem = work

    if immediate {
      work.perform()
    } else {
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.12, execute: work)
    }
  }

  private func rebuildIndexAndRefresh() {
    let descriptors = allMarkerDescriptors
    refreshGeneration += 1
    let generation = refreshGeneration

    computeQueue.async { [weak self] in
      let index = MarkerSpatialIndex(markers: descriptors)
      DispatchQueue.main.async {
        guard let self, generation == self.refreshGeneration else {
          return
        }
        self.spatialIndex = index
        self.refreshViewportMarkers()
      }
    }
  }

  private func refreshViewportMarkers() {
    guard let mapView, let index = spatialIndex else {
      return
    }

    let region = mapView.region
    let viewSize = mapView.bounds.size
    let displayed = Set(displayedAnnotations.keys)
    let clustering = clusteringEnabled
    refreshGeneration += 1
    let generation = refreshGeneration

    computeQueue.async { [weak self] in
      let candidates = index.candidates(in: region)
      let elements: [MarkerClusterEngine.Element]
      if clustering {
        elements = MarkerClusterEngine.clusters(
          candidates: candidates,
          region: region,
          viewSize: viewSize
        )
      } else {
        elements = MarkerViewportFilter
          .displaySubset(candidates: candidates, region: region)
          .map { .single($0) }
      }

      let diff = Self.computeDiff(target: elements, displayed: displayed)
      DispatchQueue.main.async {
        guard let self, generation == self.refreshGeneration else {
          return
        }
        self.applyDiff(diff)
      }
    }
  }

  private struct MarkerDiff {
    let removedKeys: Set<String>
    let added: [(key: String, annotation: MKAnnotation)]
  }

  private static func computeDiff(
    target: [MarkerClusterEngine.Element],
    displayed: Set<String>
  ) -> MarkerDiff {
    var nextKeys = Set<String>()
    nextKeys.reserveCapacity(target.count)
    var added: [(key: String, annotation: MKAnnotation)] = []

    for element in target {
      let key = element.diffKey
      guard nextKeys.insert(key).inserted else {
        continue
      }
      if !displayed.contains(key) {
        added.append((key, element.makeAnnotation()))
      }
    }

    return MarkerDiff(
      removedKeys: displayed.subtracting(nextKeys),
      added: added
    )
  }

  private func applyDiff(_ diff: MarkerDiff) {
    guard let mapView else {
      return
    }

    if !diff.removedKeys.isEmpty {
      let removed = diff.removedKeys.compactMap { displayedAnnotations.removeValue(forKey: $0) }
      mapView.removeAnnotations(removed)
    }

    if !diff.added.isEmpty {
      var annotations: [MKAnnotation] = []
      annotations.reserveCapacity(diff.added.count)
      for entry in diff.added {
        displayedAnnotations[entry.key] = entry.annotation
        annotations.append(entry.annotation)
      }
      mapView.addAnnotations(annotations)
    }
  }

  /// Synchronous reconcile for small, non-clustered datasets, including per-id
  /// coordinate updates for dynamic markers.
  private func reconcileMarkersSync(_ descriptors: [MarkerDescriptor]) {
    guard let mapView else {
      return
    }

    var nextKeys = Set<String>()
    nextKeys.reserveCapacity(descriptors.count)
    var addedAnnotations: [MKAnnotation] = []

    for descriptor in descriptors {
      let key = "s:" + descriptor.id
      nextKeys.insert(key)
      if let existing = displayedAnnotations[key] as? MapMarkerAnnotation {
        existing.update(from: descriptor)
      } else {
        let annotation = MapMarkerAnnotation(descriptor: descriptor)
        displayedAnnotations[key] = annotation
        addedAnnotations.append(annotation)
      }
    }

    let removedKeys = Set(displayedAnnotations.keys).subtracting(nextKeys)
    if !removedKeys.isEmpty {
      let removed = removedKeys.compactMap { displayedAnnotations.removeValue(forKey: $0) }
      mapView.removeAnnotations(removed)
    }

    if !addedAnnotations.isEmpty {
      mapView.addAnnotations(addedAnnotations)
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
