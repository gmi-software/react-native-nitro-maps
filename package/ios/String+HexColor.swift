import UIKit

extension String {
  /// Parses a hex color string into a `UIColor`.
  /// Supports `#RGB`, `#RRGGBB`, and `#AARRGGBB`.
  func toUIColor(fallback: UIColor = .black) -> UIColor {
    var hex = trimmingCharacters(in: .whitespacesAndNewlines).uppercased()

    if hex.hasPrefix("#") {
      hex.removeFirst()
    }

    switch hex.count {
    case 3:
      let red = hex[hex.startIndex]
      let green = hex[hex.index(hex.startIndex, offsetBy: 1)]
      let blue = hex[hex.index(hex.startIndex, offsetBy: 2)]
      hex = "\(red)\(red)\(green)\(green)\(blue)\(blue)FF"
    case 6:
      hex += "FF"
    case 8:
      break
    default:
      return fallback
    }

    guard hex.count == 8 else {
      return fallback
    }

    var value: UInt64 = 0
    guard Scanner(string: hex).scanHexInt64(&value) else {
      return fallback
    }

    let alpha = CGFloat((value & 0xFF00_0000) >> 24) / 255
    let red = CGFloat((value & 0x00FF_0000) >> 16) / 255
    let green = CGFloat((value & 0x0000_FF00) >> 8) / 255
    let blue = CGFloat(value & 0x0000_00FF) / 255

    return UIColor(red: red, green: green, blue: blue, alpha: alpha)
  }
}
