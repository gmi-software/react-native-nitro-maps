const IOS_GOOGLE_MAPS_API_KEY = 'GoogleMapsIosApiKey';

/**
 * @typedef {object} NitroMapsPluginProps
 * @property {string=} googleMapsApiKey Shared Google Maps API key for both platforms.
 * @property {string=} iosGoogleMapsApiKey Google Maps API key for iOS.
 * @property {string=} androidGoogleMapsApiKey Google Maps API key for Android.
 */

/**
 * @param {import('expo/config').ExpoConfig} config
 * @param {NitroMapsPluginProps=} props
 * @returns {import('expo/config').ExpoConfig}
 */
function withNitroMaps(config, props = {}) {
  const iosGoogleMapsApiKey =
    props.iosGoogleMapsApiKey ?? props.googleMapsApiKey;
  const androidGoogleMapsApiKey =
    props.androidGoogleMapsApiKey ?? props.googleMapsApiKey;

  if (iosGoogleMapsApiKey != null) {
    config.ios = {
      ...config.ios,
      infoPlist: {
        ...config.ios?.infoPlist,
        [IOS_GOOGLE_MAPS_API_KEY]: iosGoogleMapsApiKey,
      },
    };
  }

  if (androidGoogleMapsApiKey != null) {
    config.android = {
      ...config.android,
      config: {
        ...config.android?.config,
        googleMaps: {
          ...config.android?.config?.googleMaps,
          apiKey: androidGoogleMapsApiKey,
        },
      },
    };
  }

  return config;
}

module.exports = withNitroMaps;
