import UIKit

extension EdgePadding {
  func toUIEdgeInsets() -> UIEdgeInsets {
    UIEdgeInsets(
      top: top,
      left: left,
      bottom: bottom,
      right: right
    )
  }
}
