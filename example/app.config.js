const appJson = require('./app.json');

const iosGoogleMapsApiKey =
  process.env.GOOGLE_MAPS_IOS_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY;
const androidGoogleMapsApiKey =
  process.env.GOOGLE_MAPS_ANDROID_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY;

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    ...appJson.expo,
    plugins: [
      ...(appJson.expo.plugins ?? []),
      [
        'react-native-nitro-maps',
        {
          iosGoogleMapsApiKey,
          androidGoogleMapsApiKey,
        },
      ],
    ],
  },
};
