import MapKit
import UIKit

/// Delegate and gesture handler for `HybridMapView`'s underlying `MKMapView`.
final class HybridMapViewDelegate: NSObject, MKMapViewDelegate, UIGestureRecognizerDelegate {
  static let clusteringIdentifier = "nitro-maps-cluster"

  weak var parent: HybridMapView?

  private let markerReuseIdentifier = "NitroMapsMarker"
  private let clusterReuseIdentifier = "NitroMapsCluster"

  func installGestureRecognizers(on mapView: MKMapView) {
    let tapRecognizer = UITapGestureRecognizer(
      target: self,
      action: #selector(handleTap(_:))
    )
    tapRecognizer.delegate = self
    mapView.addGestureRecognizer(tapRecognizer)

    let longPressRecognizer = UILongPressGestureRecognizer(
      target: self,
      action: #selector(handleLongPress(_:))
    )
    longPressRecognizer.minimumPressDuration = 0.5
    longPressRecognizer.delegate = self
    mapView.addGestureRecognizer(longPressRecognizer)
  }

  @objc private func handleTap(_ recognizer: UITapGestureRecognizer) {
    guard recognizer.state == .ended, let parent else {
      return
    }

    let point = recognizer.location(in: parent.view)
    if parent.notifyOverlayPress(at: point) {
      return
    }

    if isAnnotationView(at: point, in: parent.view) {
      return
    }

    parent.notifyPress(at: point)
  }

  @objc private func handleLongPress(_ recognizer: UILongPressGestureRecognizer) {
    guard recognizer.state == .began, let parent else {
      return
    }

    let point = recognizer.location(in: parent.view)
    parent.notifyLongPress(at: point)
  }

  func gestureRecognizer(
    _ gestureRecognizer: UIGestureRecognizer,
    shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer
  ) -> Bool {
    true
  }

  private func isAnnotationView(at point: CGPoint, in mapView: MKMapView) -> Bool {
    var view: UIView? = mapView.hitTest(point, with: nil)
    while let current = view {
      if current is MKAnnotationView {
        return true
      }
      view = current.superview
    }
    return false
  }

  func mapView(_ mapView: MKMapView, regionWillChangeAnimated animated: Bool) {
    parent?.notifyRegionChange(complete: false)
  }

  func mapView(_ mapView: MKMapView, regionDidChangeAnimated animated: Bool) {
    parent?.notifyRegionChange(complete: true)
  }

  func mapViewDidFinishLoadingMap(_ mapView: MKMapView) {
    parent?.notifyMapReadyIfNeeded()
  }

  func mapViewDidFinishRenderingMap(_ mapView: MKMapView, fullyRendered: Bool) {
    guard fullyRendered else {
      return
    }

    parent?.notifyMapReadyIfNeeded()
  }

  func mapView(_ mapView: MKMapView, viewFor annotation: MKAnnotation) -> MKAnnotationView? {
    if let cluster = annotation as? MKClusterAnnotation {
      let view = mapView.dequeueReusableAnnotationView(
        withIdentifier: clusterReuseIdentifier
      ) as? MKMarkerAnnotationView
        ?? MKMarkerAnnotationView(annotation: cluster, reuseIdentifier: clusterReuseIdentifier)

      view.annotation = cluster
      view.markerTintColor = .systemBlue
      view.glyphText = "\(cluster.memberAnnotations.count)"
      return view
    }

    guard let marker = annotation as? MapMarkerAnnotation else {
      return nil
    }

    let view = mapView.dequeueReusableAnnotationView(
      withIdentifier: markerReuseIdentifier,
      for: marker
    ) as? MKMarkerAnnotationView

    let annotationView = view ?? MKMarkerAnnotationView(
      annotation: marker,
      reuseIdentifier: markerReuseIdentifier
    )
    annotationView.annotation = marker
    if let markerView = annotationView as? MKMarkerAnnotationView {
      markerView.canShowCallout = marker.title != nil || marker.subtitle != nil
      markerView.isDraggable = marker.draggable
    } else {
      annotationView.canShowCallout = marker.title != nil || marker.subtitle != nil
      annotationView.isDraggable = marker.draggable
    }
    applyClusteringIdentifier(to: annotationView, marker: marker)
    return annotationView
  }

  private func applyClusteringIdentifier(to view: MKAnnotationView, marker: MapMarkerAnnotation) {
    if parent?.clusteringEnabled == true, marker.isClusterable {
      view.clusteringIdentifier = Self.clusteringIdentifier
    } else {
      view.clusteringIdentifier = nil
    }
  }

  func mapView(_ mapView: MKMapView, didSelect view: MKAnnotationView) {
    if let cluster = view.annotation as? MKClusterAnnotation {
      let markerIds = cluster.memberAnnotations.compactMap { parent?.markerId(for: $0) }
      let coordinate = cluster.coordinate
      parent?.onClusterPress?(
        markerIds,
        Coordinate(latitude: coordinate.latitude, longitude: coordinate.longitude)
      )
      mapView.deselectAnnotation(cluster, animated: true)
      return
    }

    guard let marker = view.annotation as? MapMarkerAnnotation else {
      return
    }

    parent?.onMarkerPress?(marker.id)
    mapView.deselectAnnotation(view.annotation, animated: true)
  }

  func mapView(
    _ mapView: MKMapView,
    annotationView view: MKAnnotationView,
    didChange newState: MKAnnotationView.DragState,
    fromOldState oldState: MKAnnotationView.DragState
  ) {
    guard newState == .ending,
          let marker = view.annotation as? MapMarkerAnnotation else {
      return
    }

    parent?.onMarkerDragEnd?(
      marker.id,
      Coordinate(
        latitude: marker.coordinate.latitude,
        longitude: marker.coordinate.longitude
      )
    )
  }

  func mapView(_ mapView: MKMapView, rendererFor overlay: MKOverlay) -> MKOverlayRenderer {
    if let renderer = parent?.renderer(for: overlay) {
      return renderer
    }

    return MKOverlayRenderer(overlay: overlay)
  }
}
