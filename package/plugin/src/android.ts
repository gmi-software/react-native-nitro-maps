import {
  AndroidConfig,
  ConfigPlugin,
  withAndroidManifest,
} from '@expo/config-plugins';

import {
  type BetterMapsPluginOptions,
  requiresForegroundLocation,
  resolveAndroidGoogleMapsApiKey,
  wantsAlwaysLocation,
} from './types';

type AndroidManifest = AndroidConfig.Manifest.AndroidManifest;

export const GOOGLE_MAPS_API_KEY_META = 'com.google.android.geo.API_KEY';

export function applyGoogleMapsApiKey(
  manifest: AndroidManifest,
  apiKey: string | undefined,
): AndroidManifest {
  if (!apiKey) {
    return manifest;
  }

  const mainApplication =
    AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
  AndroidConfig.Manifest.addMetaDataItemToMainApplication(
    mainApplication,
    GOOGLE_MAPS_API_KEY_META,
    apiKey,
  );
  return manifest;
}

export function getLocationPermissions(
  options: BetterMapsPluginOptions,
): string[] {
  const permissions: string[] = [];

  if (requiresForegroundLocation(options)) {
    permissions.push(
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
    );
  }

  if (wantsAlwaysLocation(options)) {
    permissions.push('android.permission.ACCESS_BACKGROUND_LOCATION');
  }

  return permissions;
}

const withGoogleMapsApiKey: ConfigPlugin<BetterMapsPluginOptions> = (
  config,
  options = {},
) => {
  const apiKey = resolveAndroidGoogleMapsApiKey(options);
  if (!apiKey) {
    return config;
  }

  return withAndroidManifest(config, (config) => {
    config.modResults = applyGoogleMapsApiKey(config.modResults, apiKey);
    return config;
  });
};

const withLocationPermissions: ConfigPlugin<BetterMapsPluginOptions> = (
  config,
  options = {},
) => {
  const permissions = getLocationPermissions(options);
  if (permissions.length === 0) {
    return config;
  }

  return AndroidConfig.Permissions.withPermissions(config, permissions);
};

export const withBetterMapsAndroid: ConfigPlugin<BetterMapsPluginOptions> = (
  config,
  options = {},
) => {
  config = withGoogleMapsApiKey(config, options);
  config = withLocationPermissions(config, options);
  return config;
};
