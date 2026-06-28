extension MarkerDescriptor {
  func markersDescriptorFingerprint() -> Int {
    var hasher = Hasher()
    hasher.combine(id)
    hasher.combine(coordinate.latitude)
    hasher.combine(coordinate.longitude)
    if let title {
      hasher.combine(title)
    }
    if let subtitle {
      hasher.combine(subtitle)
    }
    if let draggable {
      hasher.combine(draggable)
    }
    if let clusterable {
      hasher.combine(clusterable)
    }
    if let image {
      hasher.combine(image.uri)
      if let width = image.width {
        hasher.combine(width)
      }
      if let height = image.height {
        hasher.combine(height)
      }
      if let scale = image.scale {
        hasher.combine(scale)
      }
    }
    if let anchor {
      hasher.combine(anchor.x)
      hasher.combine(anchor.y)
    }
    if let centerOffset {
      hasher.combine(centerOffset.x)
      hasher.combine(centerOffset.y)
    }
    if let rotation {
      hasher.combine(rotation)
    }
    if let flat {
      hasher.combine(flat)
    }
    if let opacity {
      hasher.combine(opacity)
    }
    if let enteringAnimation {
      hasher.combine(enteringAnimation.kind)
      if let duration = enteringAnimation.duration {
        hasher.combine(duration)
      }
      if let delay = enteringAnimation.delay {
        hasher.combine(delay)
      }
      if let reduceMotion = enteringAnimation.reduceMotion {
        hasher.combine(reduceMotion)
      }
    }
    return hasher.finalize()
  }
}

extension Array where Element == MarkerDescriptor {
  func markersFingerprint() -> Int {
    if isEmpty {
      return 0
    }

    var hash = count
    for descriptor in self {
      hash = 31 &* hash &+ descriptor.markersDescriptorFingerprint()
    }
    return hash
  }
}
