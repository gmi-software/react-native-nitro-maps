import type { ConfigPlugin } from '@expo/config-plugins';

import { withNitroMapsAndroid } from './android';
import { withNitroMapsIos } from './ios';
import type { NitroMapsPluginOptions } from './types';

export const withNitroMaps: ConfigPlugin<NitroMapsPluginOptions> = (
  config,
  options = {},
) => {
  config = withNitroMapsAndroid(config, options);
  config = withNitroMapsIos(config, options);
  return config;
};
