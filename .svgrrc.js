// SVGR options used by react-native-svg-transformer. Keep the viewBox and drop fixed width/height so BrandLogo can
// scale the authentic artwork (contain) without distorting it.
module.exports = {
  native: true,
  dimensions: false,
  svgoConfig: {
    plugins: [{ name: "preset-default", params: { overrides: { removeViewBox: false } } }]
  }
};
