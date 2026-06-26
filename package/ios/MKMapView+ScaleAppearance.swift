import MapKit
import UIKit

extension MKMapView {
  func applyScaleAppearance() {
    guard showsScale else {
      return
    }

    for container in scaleContainers(in: self) {
      styleScaleContainer(container)
    }
  }

  private func scaleContainers(in view: UIView) -> [UIView] {
    var results: [UIView] = []

    for subview in view.subviews {
      let className = String(describing: type(of: subview))
      if className.localizedCaseInsensitiveContains("scale") {
        results.append(subview)
      }
      results.append(contentsOf: scaleContainers(in: subview))
    }

    return results
  }

  private func styleScaleContainer(_ container: UIView) {
    container.backgroundColor = UIColor.black.withAlphaComponent(0.58)
    container.layer.cornerRadius = 8
    container.layer.borderWidth = 1
    container.layer.borderColor = UIColor.white.withAlphaComponent(0.14).cgColor
    container.layer.shadowColor = UIColor.black.cgColor
    container.layer.shadowOpacity = 0.28
    container.layer.shadowRadius = 6
    container.layer.shadowOffset = CGSize(width: 0, height: 2)

    styleScaleDescendants(in: container)
  }

  private func styleScaleDescendants(in view: UIView) {
    if let label = view as? UILabel {
      label.textColor = .white
      label.font = UIFont.systemFont(ofSize: 11, weight: .semibold)
      label.layer.shadowColor = UIColor.black.cgColor
      label.layer.shadowOpacity = 0.45
      label.layer.shadowRadius = 1.5
      label.layer.shadowOffset = CGSize(width: 0, height: 1)
    } else if view.subviews.isEmpty, view.bounds.height <= 4, view.bounds.width >= 6 {
      view.backgroundColor = UIColor.white.withAlphaComponent(0.9)
    }

    for subview in view.subviews {
      styleScaleDescendants(in: subview)
    }
  }
}
