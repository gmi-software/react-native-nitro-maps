import { applyLocationPermissionsToInfoPlist } from './ios';

describe('applyLocationPermissionsToInfoPlist', () => {
  it('returns the plist unchanged when location options are omitted', () => {
    expect(applyLocationPermissionsToInfoPlist({}, {})).toEqual({});
  });

  it('returns the plist unchanged when location options are false', () => {
    expect(
      applyLocationPermissionsToInfoPlist(
        {},
        {
          locationPermission: false,
          locationAlwaysPermission: false,
        },
      ),
    ).toEqual({});
  });

  it('sets NSLocationWhenInUseUsageDescription when when-in-use permission is set', () => {
    const updated = applyLocationPermissionsToInfoPlist(
      {},
      {
        locationPermission: 'Allow $(PRODUCT_NAME) to use your location.',
      },
    );

    expect(updated.NSLocationWhenInUseUsageDescription).toBe(
      'Allow $(PRODUCT_NAME) to use your location.',
    );
    expect(
      updated.NSLocationAlwaysAndWhenInUseUsageDescription,
    ).toBeUndefined();
  });

  it('backfills NSLocationWhenInUseUsageDescription when only always permission is set', () => {
    const updated = applyLocationPermissionsToInfoPlist(
      {},
      {
        locationAlwaysPermission: 'Allow background location access.',
      },
    );

    expect(updated.NSLocationAlwaysAndWhenInUseUsageDescription).toBe(
      'Allow background location access.',
    );
    expect(updated.NSLocationWhenInUseUsageDescription).toBe(
      'Allow background location access.',
    );
  });

  it('sets both location usage descriptions when both options are set', () => {
    const updated = applyLocationPermissionsToInfoPlist(
      {},
      {
        locationPermission: 'When in use',
        locationAlwaysPermission: 'Always',
      },
    );

    expect(updated.NSLocationWhenInUseUsageDescription).toBe('When in use');
    expect(updated.NSLocationAlwaysAndWhenInUseUsageDescription).toBe('Always');
  });
});
