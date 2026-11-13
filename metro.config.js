// Keep Expo's SDK 57 default Metro configuration and NativeWind transform.
// SDK 52+ automatically detects pnpm monorepos and symlinked workspace packages.
// Manually overriding watchFolders/nodeModulesPaths here made Metro derive the
// repository root as the entry resolver root, breaking expo-router/entry export.
//
// Phase 8: static .svg files (university/publisher logos) are compiled to react-native-svg components by
// react-native-svg-transformer. It is set as Metro's babel transformer BEFORE withNativeWind wraps the config, so
// NativeWind keeps handling CSS and delegates everything else (including .svg) to this transformer chain.
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer/expo")
};
config.resolver = {
  ...config.resolver,
  assetExts: config.resolver.assetExts.filter((ext) => ext !== "svg"),
  sourceExts: [...config.resolver.sourceExts, "svg"]
};

module.exports = withNativeWind(config, { input: "./global.css" });
