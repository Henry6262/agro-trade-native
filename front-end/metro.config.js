const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Keep package exports enabled for other packages
config.resolver.unstable_enablePackageExports = true;

// Fix for Zustand import.meta error
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Force Zustand to use CommonJS to avoid import.meta issues
  if (moduleName === 'zustand' || moduleName.startsWith('zustand/')) {
    return {
      type: 'sourceFile',
      filePath: require.resolve(moduleName),
    };
  }
  
  // Default resolution for other modules
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './src/styles/global.css' });