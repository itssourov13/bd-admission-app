import type { FC } from "react";
import type { ImageSourcePropType } from "react-native";
import type { SvgProps } from "react-native-svg";

/**
 * A bundled brand asset. Authentic original SVG artwork is preferred ("svg", compiled by react-native-svg-transformer).
 * "raster" is used only when the institution's own official file is a bitmap (no original vector is published).
 * Both keep the original artwork, colours and aspect ratio: the renderer only scales them to fit (contain).
 */
export type LogoAsset =
  | { kind: "svg"; Svg: FC<SvgProps>; aspect?: number }
  | { kind: "raster"; source: ImageSourcePropType; aspect?: number };
