import Foundation
import GoogleMaps

enum GoogleMapsAPIKey {
  private static var configuredKey: String?

  static func configureIfNeeded() {
    let key = Bundle.main.object(forInfoDictionaryKey: "GoogleMapsIosApiKey") as? String
    guard let key = key?.trimmingCharacters(in: .whitespacesAndNewlines),
          !key.isEmpty else {
      preconditionFailure(
        "react-native-nitro-maps: provider=\"google\" on iOS requires GoogleMapsIosApiKey in the host app Info.plist."
      )
    }

    guard configuredKey != key else {
      return
    }

    GMSServices.provideAPIKey(key)
    configuredKey = key
  }
}
