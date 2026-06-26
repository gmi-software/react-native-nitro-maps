import CoreGraphics

/// Shared cluster badge sizing used by merge tests and drawn annotation views.
enum ClusterBadgeMetrics {
  static let mergeGap: Double = 6

  static func badgeRadius(for count: Int) -> Double {
    switch count {
    case ..<2:
      return 14
    case ..<10:
      return 17
    case ..<100:
      return 20
    case ..<1000:
      return 24
    default:
      return 28
    }
  }

  static func diameter(for count: Int) -> CGFloat {
    switch count {
    case ..<10:
      return 34
    case ..<100:
      return 40
    case ..<1000:
      return 48
    default:
      return 56
    }
  }
}
