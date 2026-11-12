import { BRAND } from "./brand";
const p = BRAND.colors;
/**
 * Static, theme-independent tokens only (fonts, radii, tint palettes). Theme-dependent colours, feedback colours,
 * gradients and shadows come from `useTheme()` in "@/settings" (palettes live in src/settings/palettes.ts).
 */
export const fonts = {
  displaySemibold:"Fraunces_600SemiBold", displayBold:"Fraunces_700Bold",
  body:"Manrope_400Regular", bodyMedium:"Manrope_500Medium", bodySemibold:"Manrope_600SemiBold", bodyBold:"Manrope_700Bold",
  bengali:"HindSiliguri_400Regular", bengaliMedium:"HindSiliguri_500Medium", bengaliSemibold:"HindSiliguri_600SemiBold", bengaliBold:"HindSiliguri_700Bold"
} as const;
export const radius={sm:8,md:12,lg:16,xl:24,pill:999} as const;
export const tints = [
  [p.navy800,p.brand700],[p.brand600,p.brand800],[p.gold500,p.gold700],
  ["#426A9A","#253F64"],["#4F8C7C","#1C5E50"],["#9B7B35","#725316"]
] as const;
export function tintFor(key:string):readonly [string,string] {
  let h=0; for(let i=0;i<key.length;i++) h=(h*31+key.charCodeAt(i))>>>0;
  return tints[h%tints.length];
}
