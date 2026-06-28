import GoogleMaps
import QuartzCore
import UIKit

enum ResolvedOverlayEnteringAnimationKind {
  case none
  case system
  case fade
  case fadeScale
}

struct ResolvedOverlayEnteringAnimation {
  let kind: ResolvedOverlayEnteringAnimationKind
  let duration: TimeInterval
  let delay: TimeInterval
  let reduceMotion: OverlayEnteringAnimationReduceMotion
}

enum OverlayEnteringAnimationResolver {
  static func resolve(
    _ animation: OverlayEnteringAnimationDescriptor?,
    fallback: OverlayEnteringAnimationDescriptor? = nil
  ) -> ResolvedOverlayEnteringAnimation {
    let descriptor = animation ?? fallback
    let kind: ResolvedOverlayEnteringAnimationKind
    switch descriptor?.kind {
    case .some(.none):
      kind = .none
    case .some(.fade):
      kind = .fade
    case .some(.fadeScale):
      kind = .fadeScale
    case .some(.system), nil:
      kind = .system
    }

    return ResolvedOverlayEnteringAnimation(
      kind: kind,
      duration: seconds(fromMilliseconds: descriptor?.duration, defaultMilliseconds: 180),
      delay: seconds(fromMilliseconds: descriptor?.delay, defaultMilliseconds: 0),
      reduceMotion: descriptor?.reduceMotion ?? .system
    )
  }

  static func shouldRun(_ animation: ResolvedOverlayEnteringAnimation) -> Bool {
    guard animation.kind != .none else {
      return false
    }
    guard animation.reduceMotion != .system || !UIAccessibility.isReduceMotionEnabled else {
      return false
    }
    return animation.duration > 0
  }

  static func animateAnnotationView(
    _ view: UIView,
    animation: ResolvedOverlayEnteringAnimation,
    supportsScale: Bool
  ) {
    guard shouldRun(animation) else {
      return
    }

    let shouldScale = animation.kind == .fadeScale && supportsScale
    view.alpha = 0
    if shouldScale {
      view.transform = CGAffineTransform(scaleX: 0.85, y: 0.85)
    }

    UIView.animate(
      withDuration: animation.duration,
      delay: animation.delay,
      options: [.allowUserInteraction, .beginFromCurrentState, .curveEaseOut]
    ) {
      view.alpha = 1
      if shouldScale {
        view.transform = .identity
      }
    }
  }

  static func prepareGoogleMarker(_ marker: GMSMarker, animation: ResolvedOverlayEnteringAnimation) {
    marker.appearAnimation = .none
    let markerAnimation = googleMarkerAnimation(animation)
    guard shouldRun(markerAnimation) else {
      return
    }
    guard markerAnimation.kind != .system else {
      marker.appearAnimation = .pop
      return
    }
    marker.opacity = 0
  }

  static func animateGoogleMarker(_ marker: GMSMarker, animation: ResolvedOverlayEnteringAnimation) {
    let markerAnimation = googleMarkerAnimation(animation)
    guard shouldRun(markerAnimation), markerAnimation.kind != .system else {
      return
    }

    DispatchQueue.main.asyncAfter(deadline: .now() + markerAnimation.delay) {
      CATransaction.begin()
      CATransaction.setAnimationDuration(markerAnimation.duration)
      CATransaction.setAnimationTimingFunction(CAMediaTimingFunction(name: .easeOut))
      marker.opacity = 1
      CATransaction.commit()
    }
  }

  private static func googleMarkerAnimation(
    _ animation: ResolvedOverlayEnteringAnimation
  ) -> ResolvedOverlayEnteringAnimation {
    guard animation.kind == .fadeScale else {
      return animation
    }
    return ResolvedOverlayEnteringAnimation(
      kind: .fade,
      duration: animation.duration,
      delay: animation.delay,
      reduceMotion: animation.reduceMotion
    )
  }

  private static func seconds(
    fromMilliseconds value: Double?,
    defaultMilliseconds: Double
  ) -> TimeInterval {
    guard let value, value.isFinite else {
      return defaultMilliseconds / 1000
    }
    return min(3000, max(0, value)) / 1000
  }
}
