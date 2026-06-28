import { AndroidConfig } from '@expo/config-plugins';

import {
  applyGoogleMapsApiKey,
  getLocationPermissions,
  GOOGLE_MAPS_API_KEY_META,
} from './android';

function createEmptyManifest(): AndroidConfig.Manifest.AndroidManifest {
  return {
    manifest: {
      $: {
        'xmlns:android': 'http://schemas.android.com/apk/res/android',
      },
      application: [
        {
          $: {
            'android:name': '.MainApplication',
          },
        },
      ],
    },
  };
}

describe('applyGoogleMapsApiKey', () => {
  it('injects com.google.android.geo.API_KEY meta-data into AndroidManifest', () => {
    const manifest = createEmptyManifest();
    applyGoogleMapsApiKey(manifest, 'test-api-key');

    expect(
      AndroidConfig.Manifest.getMainApplicationOrThrow(manifest)['meta-data'],
    ).toEqual([
      {
        $: {
          'android:name': GOOGLE_MAPS_API_KEY_META,
          'android:value': 'test-api-key',
        },
      },
    ]);
  });
});

describe('getLocationPermissions', () => {
  it('returns no permissions when location options are omitted', () => {
    expect(getLocationPermissions({})).toEqual([]);
  });

  it('returns no permissions when location options are false', () => {
    expect(
      getLocationPermissions({
        locationPermission: false,
        locationAlwaysPermission: false,
      }),
    ).toEqual([]);
  });

  it('adds fine and coarse location when when-in-use permission is set', () => {
    expect(
      getLocationPermissions({
        locationPermission: 'Allow location access',
      }),
    ).toEqual([
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
    ]);
  });

  it('adds foreground permissions alongside background when only always permission is set', () => {
    expect(
      getLocationPermissions({
        locationAlwaysPermission: 'Allow background location',
      }),
    ).toEqual([
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_BACKGROUND_LOCATION',
    ]);
  });

  it('adds all location permissions when both messages are set', () => {
    expect(
      getLocationPermissions({
        locationPermission: 'Allow location access',
        locationAlwaysPermission: 'Allow background location',
      }),
    ).toEqual([
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_BACKGROUND_LOCATION',
    ]);
  });
});
