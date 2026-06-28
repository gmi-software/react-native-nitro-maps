export type NitroMapsPluginOptions = {
  /**
   * Shared Google Maps API key for both platforms when platform-specific keys are omitted.
   */
  googleMapsApiKey?: string;
  /**
   * Google Maps API key for iOS (`GoogleMapsIosApiKey` in Info.plist).
   */
  iosGoogleMapsApiKey?: string;
  /**
   * Google Maps API key for Android (`com.google.android.geo.API_KEY` meta-data).
   */
  androidGoogleMapsApiKey?: string;
  /**
   * When set to a string, adds `NSLocationWhenInUseUsageDescription` on iOS and
   * `ACCESS_FINE_LOCATION` + `ACCESS_COARSE_LOCATION` on Android.
   * Pass `false` or omit to skip.
   */
  locationPermission?: string | false;
  /**
   * When set to a string, adds `NSLocationAlwaysAndWhenInUseUsageDescription` on iOS and
   * `ACCESS_BACKGROUND_LOCATION` on Android.
   * Pass `false` or omit to skip.
   */
  locationAlwaysPermission?: string | false;
};

export function wantsWhenInUseLocation(
  options: NitroMapsPluginOptions,
): options is NitroMapsPluginOptions & { locationPermission: string } {
  return typeof options.locationPermission === 'string';
}

export function wantsAlwaysLocation(
  options: NitroMapsPluginOptions,
): options is NitroMapsPluginOptions & { locationAlwaysPermission: string } {
  return typeof options.locationAlwaysPermission === 'string';
}

export function requiresForegroundLocation(
  options: NitroMapsPluginOptions,
): boolean {
  return wantsWhenInUseLocation(options) || wantsAlwaysLocation(options);
}

export function resolveIosGoogleMapsApiKey(
  options: NitroMapsPluginOptions,
): string | undefined {
  return options.iosGoogleMapsApiKey ?? options.googleMapsApiKey;
}

export function resolveAndroidGoogleMapsApiKey(
  options: NitroMapsPluginOptions,
): string | undefined {
  return options.androidGoogleMapsApiKey ?? options.googleMapsApiKey;
}
