const brand = require("./brand.config.json");
const c = brand.colors;
/** @type {import("tailwindcss").Config} */
module.exports = {
  content:["./app/**/*.{js,jsx,ts,tsx}","./src/**/*.{js,jsx,ts,tsx}"],
  presets:[require("nativewind/preset")],
  theme:{extend:{colors:{
    navy:{800:c.navy800,900:c.navy900},
    brand:{100:c.brand100,200:c.brand200,500:c.brand500,600:c.brand600,700:c.brand700,800:c.brand800},
    gold:{100:c.gold100,400:c.gold400,500:c.gold500,700:c.gold700},
    ink:{900:c.ink900,800:c.ink800,700:c.ink700,500:c.ink500,400:c.ink400,300:c.ink300},
    sand:{50:c.sand50,100:c.sand100,200:c.sand200,300:c.sand300},
    body:c.body,surface:c.surface
  },fontFamily:{
    display:["Fraunces_600SemiBold"],"display-bold":["Fraunces_700Bold"],sans:["Manrope_400Regular"],
    medium:["Manrope_500Medium"],semibold:["Manrope_600SemiBold"],bold:["Manrope_700Bold"],
    bengali:["HindSiliguri_400Regular"],"bengali-semibold":["HindSiliguri_600SemiBold"]
  }}},
  plugins:[]
};
