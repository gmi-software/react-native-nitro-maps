export type NitroMapsPluginOptions = {
  /**
   * Google Maps API key for Android (`com.google.android.geo.API_KEY` meta-data).
   * Reserved for future iOS Google Maps support (#2); no-op on iOS today (MapKit needs no key).
   */
  googleMapsApiKey?: string;
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
