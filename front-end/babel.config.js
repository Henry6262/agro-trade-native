module.exports = function (api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo', 'nativewind/babel'],
    plugins: [
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
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
