const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Keep package exports enabled for other packages
config.resolver.unstable_enablePackageExports = true;

// Fix for Zustand import.meta error and react-native-maps on web
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Force Zustand to use CommonJS to avoid import.meta issues
  if (moduleName === 'zustand' || moduleName.startsWith('zustand/')) {
    return {
      type: 'sourceFile',
      filePath: require.resolve(moduleName),
    };
  }
  
  // Handle react-native-maps on web - return mock module
  if (platform === 'web' && moduleName === 'react-native-maps') {
    // Return a mock module for web to prevent import errors
    return {
      type: 'sourceFile', 
      filePath: require.resolve('./src/components/dashboard/base-management/GoogleMapWeb.tsx'),
    };
  }
  
  // Default resolution for other modules
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './src/styles/global.css' });