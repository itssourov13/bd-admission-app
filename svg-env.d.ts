// Static SVG assets are compiled to react-native-svg components by react-native-svg-transformer (see metro.config.js).
declare module "*.svg" {
  import type { FC } from "react";
  import type { SvgProps } from "react-native-svg";
  const content: FC<SvgProps>;
  export default content;
}
