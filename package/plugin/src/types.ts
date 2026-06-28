export type BetterMapsPluginOptions = {
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
  options: BetterMapsPluginOptions,
): options is BetterMapsPluginOptions & { locationPermission: string } {
  return typeof options.locationPermission === 'string';
}

export function wantsAlwaysLocation(
  options: BetterMapsPluginOptions,
): options is BetterMapsPluginOptions & { locationAlwaysPermission: string } {
  return typeof options.locationAlwaysPermission === 'string';
}

export function requiresForegroundLocation(
  options: BetterMapsPluginOptions,
): boolean {
  return wantsWhenInUseLocation(options) || wantsAlwaysLocation(options);
}

export function resolveIosGoogleMapsApiKey(
  options: BetterMapsPluginOptions,
): string | undefined {
  return options.iosGoogleMapsApiKey ?? options.googleMapsApiKey;
}

export function resolveAndroidGoogleMapsApiKey(
  options: BetterMapsPluginOptions,
): string | undefined {
  return options.androidGoogleMapsApiKey ?? options.googleMapsApiKey;
}
