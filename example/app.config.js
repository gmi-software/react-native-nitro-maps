const appJson = require('./app.json');

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    ...appJson.expo,
    plugins: [
      [
        'react-native-nitro-maps',
        {
          googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
          locationPermission:
            'Allow $(PRODUCT_NAME) to use your location for map features.',
        },
      ],
    ],
  },
};
