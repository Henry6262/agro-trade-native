/* eslint-disable @typescript-eslint/no-require-imports */
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Keep package exports enabled for other packages
config.resolver.unstable_enablePackageExports = true;

// Add platform-specific extensions and aliases for web compatibility
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Redirect react-native-maps to a web shim on web platform
  if (platform === 'web' && moduleName === 'react-native-maps') {
    return {
      filePath: require.resolve('./src/utils/maps.web.ts'),
      type: 'sourceFile',
    };
  }

  // Default resolution for other modules
  return context.resolveRequest(context, moduleName, platform);
};

// Enable NativeWind without CSS file import
module.exports = withNativeWind(config, {
  input: './src/styles/global.css',
  inlineRem: false,
});
