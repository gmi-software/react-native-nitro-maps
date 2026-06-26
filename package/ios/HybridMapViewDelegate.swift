import MapKit
import UIKit

/// Delegate and gesture handler for `HybridMapView`'s underlying `MKMapView`.
final class HybridMapViewDelegate: NSObject, MKMapViewDelegate, UIGestureRecognizerDelegate {
  weak var parent: HybridMapView?

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
    parent?.startLiveClustering()
    parent?.notifyRegionChange(complete: false)
  }

  func mapView(_ mapView: MKMapView, regionDidChangeAnimated animated: Bool) {
    parent?.stopLiveClustering()
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
    if let cluster = annotation as? MapClusterAnnotation {
      let view = mapView.dequeueReusableAnnotationView(
        withIdentifier: NitroClusterAnnotationView.reuseIdentifier
      ) as? NitroClusterAnnotationView
        ?? NitroClusterAnnotationView(
          annotation: cluster,
          reuseIdentifier: NitroClusterAnnotationView.reuseIdentifier
        )

      view.annotation = cluster
      view.configure(count: cluster.count)
      return view
    }

    guard let marker = annotation as? MapMarkerAnnotation else {
      return nil
    }

    let pinView = mapView.dequeueReusableAnnotationView(
      withIdentifier: NitroPinAnnotationView.reuseIdentifier
    ) as? NitroPinAnnotationView
      ?? NitroPinAnnotationView(
        annotation: marker,
        reuseIdentifier: NitroPinAnnotationView.reuseIdentifier
      )

    pinView.configure(for: marker)
    return pinView
  }

  func mapView(_ mapView: MKMapView, didAdd views: [MKAnnotationView]) {
    for view in views {
      // Markers use MapKit's native drop animation; only fade in cluster badges.
      guard view.annotation is MapClusterAnnotation else {
        continue
      }
      view.alpha = 0
      UIView.animate(
        withDuration: 0.16,
        delay: 0,
        options: [.allowUserInteraction, .beginFromCurrentState, .curveEaseOut]
      ) {
        view.alpha = 1
      }
    }
  }

  func mapView(_ mapView: MKMapView, didSelect view: MKAnnotationView) {
    if let cluster = view.annotation as? MapClusterAnnotation {
      let coordinate = cluster.coordinate
      parent?.onClusterPress?(
        cluster.memberIds,
        Coordinate(latitude: coordinate.latitude, longitude: coordinate.longitude)
      )
      parent?.animateToClusterRegion(cluster.region)
      mapView.deselectAnnotation(cluster, animated: false)
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
