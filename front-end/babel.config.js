module.exports = function (api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // NativeWind (react-native-css-interop) babel transforms.
      // Written out manually instead of using 'nativewind/babel' preset because
      // react-native-css-interop/babel.js hardcodes 'react-native-worklets/plugin'
      // for Reanimated 4+ compatibility, but we are on Reanimated 3.x which bundles
      // worklets internally — including worklets-core causes 84 duplicate linker symbols.
      require('react-native-css-interop/dist/babel-plugin').default,
      [
        '@babel/plugin-transform-react-jsx',
        {
          runtime: 'automatic',
          importSource: 'react-native-css-interop',
        },
      ],
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@features': './src/features',
            '@pages': './src/pages',
            '@shared': './src/shared',
            '@navigation': './src/navigation',
            '@stores': './src/stores',
            '@services': './src/services',
            '@assets': './src/assets',
            '@styles': './src/styles',
            '@contexts': './src/contexts',
            '@design-system': './src/design-system',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
