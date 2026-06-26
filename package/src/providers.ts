import { Platform } from 'react-native';
import type { MapProvider } from './types/map';

type SupportedProvidersByPlatform = {
  ios: readonly MapProvider[];
  android: readonly MapProvider[];
};

const SUPPORTED_PROVIDERS: SupportedProvidersByPlatform = {
  ios: ['apple'],
  android: ['google'],
};

export function getDefaultMapProvider(): MapProvider {
  switch (Platform.OS) {
    case 'ios':
      return 'apple';
    case 'android':
      return 'google';
    default:
      throw new Error(
        `react-native-nitro-maps does not support platform "${Platform.OS}".`,
      );
  }
}

export function resolveMapProvider(
  provider: MapProvider | undefined,
): MapProvider {
  const resolvedProvider = provider ?? getDefaultMapProvider();
  assertMapProviderSupported(resolvedProvider);
  return resolvedProvider;
}

function assertMapProviderSupported(provider: MapProvider): void {
  const supportedProviders = getSupportedProvidersForCurrentPlatform();

  if (supportedProviders.includes(provider)) {
    return;
  }

  throw new Error(
    `Map provider "${provider}" is not supported on ${Platform.OS}. ` +
      `Supported providers: ${supportedProviders.join(', ') || 'none'}.`,
  );
}

function getSupportedProvidersForCurrentPlatform(): readonly MapProvider[] {
  switch (Platform.OS) {
    case 'ios':
      return SUPPORTED_PROVIDERS.ios;
    case 'android':
      return SUPPORTED_PROVIDERS.android;
    default:
      return [];
  }
}
