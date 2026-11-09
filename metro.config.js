// Metro configuration
//
// We share a sibling folder (`arcanist-common`) with the server. Metro by
// default only resolves modules under the project root, so we explicitly:
//   1. add `arcanist-common` to `watchFolders` so Metro tracks file changes there
//   2. expose it via `extraNodeModules` so `import ... from 'arcanist-common'`
//      resolves to that folder without needing a node_modules entry.

const path = require('path');
const { getDefaultConfig } = require('@expo/metro-config');

const projectRoot = __dirname;
const commonPath = path.resolve(projectRoot, '..', 'arcanist-common');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [...(config.watchFolders || []), commonPath];

config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    ...(config.resolver?.extraNodeModules || {}),
    'arcanist-common': commonPath,
  },
};

module.exports = config;
