const brand = require("./brand.config.json");

module.exports = {
  name: brand.name,
  slug: brand.slug,
  version: brand.version,
  orientation: "portrait",
  scheme: brand.scheme,
  userInterfaceStyle: "light",
  icon: "./assets/brand/app-icon.png",
  primaryColor: brand.colors.brand500,
  backgroundColor: brand.colors.body,
  ios: { supportsTablet: true, bundleIdentifier: brand.applicationId },
  android: {
    package: brand.applicationId,
    versionCode: 1,
    permissions: [],
    blockedPermissions: ["android.permission.SYSTEM_ALERT_WINDOW"],
    adaptiveIcon: {
      foregroundImage: "./assets/brand/adaptive-icon.png",
      backgroundColor: brand.colors.navy900
    }
  },
  plugins: [
    "expo-router",
    ["expo-sqlite", { enableFTS: true }],
    "expo-font",
    ["expo-localization", { supportedLocales: { android: ["bn", "en"], ios: ["bn", "en"] } }],
    ["expo-splash-screen", { image: "./assets/brand/splash-icon.png", imageWidth: 196, backgroundColor: brand.colors.body }]
  ],
  experiments: { typedRoutes: true }
};
