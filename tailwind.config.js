const v = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;
/** @type {import("tailwindcss").Config} */
module.exports = {
  content:["./app/**/*.{js,jsx,ts,tsx}","./src/**/*.{js,jsx,ts,tsx}"],
  presets:[require("nativewind/preset")],
  // Theme colours are CSS variables (set per scheme by AppearanceProvider; see src/settings/palettes.ts).
  theme:{extend:{colors:{
    navy:{800:v("navy-800"),900:v("navy-900")},
    brand:{100:v("brand-100"),200:v("brand-200"),500:v("brand-500"),600:v("brand-600"),700:v("brand-700"),800:v("brand-800")},
    gold:{100:v("gold-100"),400:v("gold-400"),500:v("gold-500"),700:v("gold-700")},
    ink:{900:v("ink-900"),800:v("ink-800"),700:v("ink-700"),500:v("ink-500"),400:v("ink-400"),300:v("ink-300")},
    sand:{50:v("sand-50"),100:v("sand-100"),200:v("sand-200"),300:v("sand-300")},
    body:v("body"),surface:v("surface")
  },fontFamily:{
    display:["Fraunces_600SemiBold"],"display-bold":["Fraunces_700Bold"],sans:["Manrope_400Regular"],
    medium:["Manrope_500Medium"],semibold:["Manrope_600SemiBold"],bold:["Manrope_700Bold"],
    bengali:["HindSiliguri_400Regular"],"bengali-semibold":["HindSiliguri_600SemiBold"]
  }}},
  plugins:[]
};
