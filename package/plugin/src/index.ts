import { createRunOncePlugin } from '@expo/config-plugins';

import packageJson from '../../package.json';
import type { NitroMapsPluginOptions } from './types';
import { withNitroMaps } from './withNitroMaps';

export type { NitroMapsPluginOptions };
export { withNitroMaps };

const withNitroMapsPlugin = createRunOncePlugin(
  withNitroMaps,
  packageJson.name,
  packageJson.version,
);

export default withNitroMapsPlugin;
