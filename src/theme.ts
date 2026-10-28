import { BRAND } from "./brand";
const p = BRAND.colors;
export const colors = {
  navy900:p.navy900, navy800:p.navy800,
  ink900:p.ink900, ink800:p.ink800, ink700:p.ink700, ink500:p.ink500, ink400:p.ink400, ink300:p.ink300,
  sand50:p.sand50, sand100:p.sand100, sand200:p.sand200, sand300:p.sand300,
  brand100:p.brand100, brand200:p.brand200, brand500:p.brand500, brand600:p.brand600, brand700:p.brand700, brand800:p.brand800,
  gold100:p.gold100, gold400:p.gold400, gold500:p.gold500, gold700:p.gold700,
  bgBody:p.body, surface:p.surface, border:p.border, white:p.white
} as const;
export const fonts = {
  displaySemibold:"Fraunces_600SemiBold", displayBold:"Fraunces_700Bold",
  body:"Manrope_400Regular", bodyMedium:"Manrope_500Medium", bodySemibold:"Manrope_600SemiBold", bodyBold:"Manrope_700Bold",
  bengali:"HindSiliguri_400Regular", bengaliMedium:"HindSiliguri_500Medium", bengaliSemibold:"HindSiliguri_600SemiBold", bengaliBold:"HindSiliguri_700Bold"
} as const;
export const radius={sm:8,md:12,lg:16,xl:24,pill:999} as const;
export const gradients = {
  hero:[p.navy900,p.navy800,p.brand800] as const,
  heroSoft:[p.brand600,p.brand800] as const,
  guides:[p.navy800,p.brand800] as const,
  profile:[p.navy900,p.brand700] as const,
  avatar:[p.gold400,p.gold500] as const,
  fab:[p.brand500,p.brand800] as const,
  signin:[p.brand100,p.body,p.gold100] as const
} as const;
export const tints = [
  [p.navy800,p.brand700],[p.brand600,p.brand800],[p.gold500,p.gold700],
  ["#426A9A","#253F64"],["#4F8C7C","#1C5E50"],["#9B7B35","#725316"]
] as const;
export function tintFor(key:string):readonly [string,string] {
  let h=0; for(let i=0;i<key.length;i++) h=(h*31+key.charCodeAt(i))>>>0;
  return tints[h%tints.length];
}
export const shadow = {
  sm:{shadowColor:p.navy900,shadowOffset:{width:0,height:2},shadowOpacity:0.06,shadowRadius:8,elevation:2},
  md:{shadowColor:p.navy900,shadowOffset:{width:0,height:8},shadowOpacity:0.10,shadowRadius:20,elevation:5},
  brand:{shadowColor:p.brand700,shadowOffset:{width:0,height:7},shadowOpacity:0.20,shadowRadius:16,elevation:5}
} as const;
