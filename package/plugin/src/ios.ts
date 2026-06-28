import { ConfigPlugin, IOSConfig, withInfoPlist } from '@expo/config-plugins';

import {
  type NitroMapsPluginOptions,
  requiresForegroundLocation,
  wantsAlwaysLocation,
  wantsWhenInUseLocation,
} from './types';

type InfoPlist = IOSConfig.InfoPlist;

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
  if (!requiresForegroundLocation(options)) {
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
