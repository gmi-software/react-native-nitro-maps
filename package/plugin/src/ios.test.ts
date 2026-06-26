import { IOSConfig } from '@expo/config-plugins';

import { applyLocationPermissionsToInfoPlist } from './ios';

function createEmptyInfoPlist(): IOSConfig.InfoPlist {
  return {};
}

describe('applyLocationPermissionsToInfoPlist', () => {
  it('returns the plist unchanged when location options are omitted', () => {
    const infoPlist = createEmptyInfoPlist();
    expect(applyLocationPermissionsToInfoPlist(infoPlist, {})).toEqual({});
  });

  it('returns the plist unchanged when location options are false', () => {
    const infoPlist = createEmptyInfoPlist();
    expect(
      applyLocationPermissionsToInfoPlist(infoPlist, {
        locationPermission: false,
        locationAlwaysPermission: false,
      }),
    ).toEqual({});
  });

  it('sets NSLocationWhenInUseUsageDescription when when-in-use permission is set', () => {
    const updated = applyLocationPermissionsToInfoPlist(createEmptyInfoPlist(), {
      locationPermission: 'Allow $(PRODUCT_NAME) to use your location.',
    });

    expect(updated.NSLocationWhenInUseUsageDescription).toBe(
      'Allow $(PRODUCT_NAME) to use your location.',
    );
    expect(updated.NSLocationAlwaysAndWhenInUseUsageDescription).toBeUndefined();
  });

  it('sets NSLocationAlwaysAndWhenInUseUsageDescription when always permission is set', () => {
    const updated = applyLocationPermissionsToInfoPlist(createEmptyInfoPlist(), {
      locationAlwaysPermission: 'Allow background location access.',
    });

    expect(updated.NSLocationAlwaysAndWhenInUseUsageDescription).toBe(
      'Allow background location access.',
    );
    expect(updated.NSLocationWhenInUseUsageDescription).toBeUndefined();
  });

  it('sets both location usage descriptions when both options are set', () => {
    const updated = applyLocationPermissionsToInfoPlist(createEmptyInfoPlist(), {
      locationPermission: 'When in use',
      locationAlwaysPermission: 'Always',
    });

    expect(updated.NSLocationWhenInUseUsageDescription).toBe('When in use');
    expect(updated.NSLocationAlwaysAndWhenInUseUsageDescription).toBe('Always');
  });
});
