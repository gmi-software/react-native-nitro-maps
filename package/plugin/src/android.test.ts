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

function getApiKeyMetaValue(
  manifest: AndroidConfig.Manifest.AndroidManifest,
): string | undefined {
  const application = manifest.manifest.application?.[0];
  const metaData = application?.['meta-data'] ?? [];
  const entry = metaData.find(
    (item) => item.$['android:name'] === GOOGLE_MAPS_API_KEY_META,
  );

  return entry?.$['android:value'];
}

describe('applyGoogleMapsApiKey', () => {
  it('returns the manifest unchanged when apiKey is omitted', () => {
    const manifest = createEmptyManifest();
    expect(applyGoogleMapsApiKey(manifest, undefined)).toBe(manifest);
    expect(getApiKeyMetaValue(manifest)).toBeUndefined();
  });

  it('injects com.google.android.geo.API_KEY meta-data when apiKey is provided', () => {
    const manifest = createEmptyManifest();
    const updated = applyGoogleMapsApiKey(manifest, 'test-api-key');

    expect(getApiKeyMetaValue(updated)).toBe('test-api-key');
    expect(
      AndroidConfig.Manifest.getMainApplicationOrThrow(updated)['meta-data'],
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          $: {
            'android:name': GOOGLE_MAPS_API_KEY_META,
            'android:value': 'test-api-key',
          },
        }),
      ]),
    );
  });

  it('overwrites an existing API key meta-data entry', () => {
    const manifest = applyGoogleMapsApiKey(
      createEmptyManifest(),
      'initial-key',
    );
    const updated = applyGoogleMapsApiKey(manifest, 'updated-key');

    expect(getApiKeyMetaValue(updated)).toBe('updated-key');
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

  it('adds background location when always permission is set', () => {
    expect(
      getLocationPermissions({
        locationAlwaysPermission: 'Allow background location',
      }),
    ).toEqual(['android.permission.ACCESS_BACKGROUND_LOCATION']);
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
