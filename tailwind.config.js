const { heroui } = require("@heroui/theme");
const config = {
  purge: [],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: { 
      screens: {
        phone: "280px",
        tablet: "768px",
        laptop: "1024px",
        desktop: "1280px",
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [heroui({ addCommonColors: true })],
}

export default config;

