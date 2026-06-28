import { Platform } from 'react-native';
import type { MapProvider } from './types/map';

const SUPPORTED_PROVIDERS = {
  ios: ['apple', 'google'],
  android: ['google'],
} as const satisfies Record<string, readonly MapProvider[]>;

type SupportedPlatform = keyof typeof SUPPORTED_PROVIDERS;

export function getDefaultMapProvider(): MapProvider {
  const [defaultProvider] = getSupportedProvidersForCurrentPlatform();
  if (defaultProvider != null) {
    return defaultProvider;
  }

  throw new Error(
    `react-native-better-maps does not support platform "${Platform.OS}".`,
  );
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
  if (isSupportedPlatform(Platform.OS)) {
    return SUPPORTED_PROVIDERS[Platform.OS];
  }

  return [];
}

function isSupportedPlatform(platform: string): platform is SupportedPlatform {
  return platform in SUPPORTED_PROVIDERS;
}
