const iosGoogleMapsApiKey = process.env.GOOGLE_MAPS_IOS_API_KEY;
const androidGoogleMapsApiKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY;

module.exports = ({ config }) => ({
  ...config,
  ios: {
    ...config.ios,
    ...(iosGoogleMapsApiKey
      ? {
          config: {
            ...config.ios?.config,
            googleMapsApiKey: iosGoogleMapsApiKey,
          },
        }
      : {}),
  },
  android: {
    ...config.android,
    ...(androidGoogleMapsApiKey
      ? {
          config: {
            ...config.android?.config,
            googleMaps: {
              ...config.android?.config?.googleMaps,
              apiKey: androidGoogleMapsApiKey,
            },
          },
        }
      : {}),
  },
});
