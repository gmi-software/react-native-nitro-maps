import { ConfigPlugin, IOSConfig, withInfoPlist } from '@expo/config-plugins';

import {
  type NitroMapsPluginOptions,
  requiresForegroundLocation,
  resolveIosGoogleMapsApiKey,
  wantsAlwaysLocation,
  wantsWhenInUseLocation,
} from './types';

type InfoPlist = IOSConfig.InfoPlist;

export const IOS_GOOGLE_MAPS_API_KEY = 'GoogleMapsIosApiKey';

export function applyGoogleMapsIosApiKey(
  infoPlist: InfoPlist,
  apiKey: string | undefined,
): InfoPlist {
  if (!apiKey) {
    return infoPlist;
  }

  return {
    ...infoPlist,
    [IOS_GOOGLE_MAPS_API_KEY]: apiKey,
  };
}

export function applyLocationPermissionsToInfoPlist(
  infoPlist: InfoPlist,
  options: NitroMapsPluginOptions,
): InfoPlist {
  if (requiresForegroundLocation(options)) {
    infoPlist.NSLocationWhenInUseUsageDescription = wantsWhenInUseLocation(
      options,
    )
      ? options.locationPermission
      : options.locationAlwaysPermission;
  }
  if (wantsAlwaysLocation(options)) {
    infoPlist.NSLocationAlwaysAndWhenInUseUsageDescription =
      options.locationAlwaysPermission;
  }

  return infoPlist;
}

export const withNitroMapsIos: ConfigPlugin<NitroMapsPluginOptions> = (
  config,
  options = {},
) => {
  const iosGoogleMapsApiKey = resolveIosGoogleMapsApiKey(options);
  const needsLocation = requiresForegroundLocation(options);

  if (!iosGoogleMapsApiKey && !needsLocation) {
    return config;
  }

  return withInfoPlist(config, (config) => {
    if (iosGoogleMapsApiKey) {
      config.modResults = applyGoogleMapsIosApiKey(
        config.modResults,
        iosGoogleMapsApiKey,
      );
    }
    if (needsLocation) {
      config.modResults = applyLocationPermissionsToInfoPlist(
        config.modResults,
        options,
      );
    }
    return config;
  });
};
