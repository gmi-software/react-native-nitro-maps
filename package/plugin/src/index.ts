import { createRunOncePlugin } from '@expo/config-plugins';

import packageJson from '../../package.json';
import type { BetterMapsPluginOptions } from './types';
import { withBetterMaps } from './withBetterMaps';

export type { BetterMapsPluginOptions };
export { withBetterMaps };

const withBetterMapsPlugin = createRunOncePlugin(
  withBetterMaps,
  packageJson.name,
  packageJson.version,
);

export default withBetterMapsPlugin;
