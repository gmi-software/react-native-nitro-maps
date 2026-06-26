const appJson = require('./app.json');

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    ...appJson.expo,
    ios: {
      ...appJson.expo.ios,
      infoPlist: {
        ...appJson.expo.ios?.infoPlist,
        GoogleMapsIosApiKey: process.env.GOOGLE_MAPS_IOS_API_KEY ?? '',
      },
    },
    android: {
      ...appJson.expo.android,
      config: {
        googleMaps: {
          apiKey:
            process.env.GOOGLE_MAPS_ANDROID_API_KEY ??
            process.env.GOOGLE_MAPS_API_KEY ??
            '',
        },
      },
    },
  },
};
