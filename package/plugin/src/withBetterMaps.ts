import type { ConfigPlugin } from '@expo/config-plugins';

import { withBetterMapsAndroid } from './android';
import { withBetterMapsIos } from './ios';
import type { BetterMapsPluginOptions } from './types';

export const withBetterMaps: ConfigPlugin<BetterMapsPluginOptions> = (
  config,
  options = {},
) => {
  config = withBetterMapsAndroid(config, options);
  config = withBetterMapsIos(config, options);
  return config;
};
