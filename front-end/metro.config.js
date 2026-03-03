/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Resolve jose package with browser conditions for React Native
const resolveRequestWithPackageExports = (context, moduleName, platform) => {
  // Redirect react-native-maps to a web shim on web platform
  if (platform === 'web' && moduleName === 'react-native-maps') {
    return {
      filePath: require.resolve('./src/utils/maps.web.ts'),
      type: 'sourceFile',
    };
  }

  // Force jose to use browser bundle (avoids Node.js crypto)
  if (moduleName === 'jose') {
    const ctx = {
      ...context,
      unstable_conditionNames: ['browser'],
    };
    return ctx.resolveRequest(ctx, moduleName, platform);
  }

  // Disable package exports for isows
  if (moduleName === 'isows') {
    const ctx = {
      ...context,
      unstable_enablePackageExports: false,
    };
    return ctx.resolveRequest(ctx, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

// Keep package exports enabled for other packages
config.resolver.unstable_enablePackageExports = true;

// Add polyfills for Node.js modules used by Privy
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  url: require.resolve('empty-module'),
  crypto: require.resolve('./cryptoPolyfill'),
  stream: require.resolve('stream-browserify'),
  buffer: path.resolve(__dirname, 'node_modules/buffer/index.js'),
  http: require.resolve('http-browserify'),
  https: require.resolve('https-browserify'),
  zlib: require.resolve('empty-module'),
  events: require.resolve('eventemitter3'),
  util: require.resolve('util'),
};

config.resolver.resolveRequest = resolveRequestWithPackageExports;

// Enable NativeWind without CSS file import
module.exports = withNativeWind(config, {
  input: './src/styles/global.css',
  inlineRem: false,
});
