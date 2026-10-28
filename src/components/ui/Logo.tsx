import { Image } from "react-native";
/** Locally bundled Admission brand mark. */
export function Logo({ size=48 }:{size?:number}) {
  return <Image source={require("../../../assets/brand/logo-mark.png")} style={{width:size,height:size}} resizeMode="contain" accessibilityLabel="BD Admission"/>;
}
