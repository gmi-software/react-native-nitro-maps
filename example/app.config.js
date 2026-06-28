const appJson = require('./app.json');

function readEnv(name) {
  const value = process.env[name];
  return value == null || value.trim() === '' ? undefined : value;
}

const googleMapsApiKey = readEnv('GOOGLE_MAPS_API_KEY');
const iosGoogleMapsApiKey =
  readEnv('GOOGLE_MAPS_IOS_API_KEY') ?? googleMapsApiKey;
const androidGoogleMapsApiKey =
  readEnv('GOOGLE_MAPS_ANDROID_API_KEY') ?? googleMapsApiKey;

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    ...appJson.expo,
    plugins: [
      ...(appJson.expo.plugins ?? []),
      [
        'react-native-better-maps',
        {
          iosGoogleMapsApiKey,
          androidGoogleMapsApiKey,
          locationPermission:
            'Allow $(PRODUCT_NAME) to use your location for map features.',
        },
      ],
    ],
  },
};
