import { ConfigPlugin, IOSConfig, withInfoPlist } from '@expo/config-plugins';

import {
  type NitroMapsPluginOptions,
  wantsAlwaysLocation,
  wantsWhenInUseLocation,
} from './types';

type InfoPlist = IOSConfig.InfoPlist;

export function applyLocationPermissionsToInfoPlist(
  infoPlist: InfoPlist,
  options: NitroMapsPluginOptions,
): InfoPlist {
  if (wantsWhenInUseLocation(options)) {
    infoPlist.NSLocationWhenInUseUsageDescription = options.locationPermission;
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
  // googleMapsApiKey is intentionally unused on iOS: MapKit needs no key (#2).
  if (!wantsWhenInUseLocation(options) && !wantsAlwaysLocation(options)) {
    return config;
  }

  return withInfoPlist(config, (config) => {
    config.modResults = applyLocationPermissionsToInfoPlist(
      config.modResults,
      options,
    );
    return config;
  });
};
