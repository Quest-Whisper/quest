/** @type {import('tailwindcss').Config} */
const { heroui } = require("@heroui/theme");
const config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/components/(badge|button|card|chip|date-input|date-picker|drawer|dropdown|input|input-otp|modal|pagination|popover|progress|radio|select|spinner|toggle|table|user|ripple|form|calendar|menu|divider|listbox|scroll-shadow|checkbox|spacer|avatar).js"
  ],
  purge: [], 
  theme: {
    extend: { 
      screens: {
        phone: "280px",
        tablet: "768px",
        laptop: "1024px",
        desktop: "1280px",
      },
      fontFamily: {
        sans: ["var(--font-rubik)", "system-ui", "sans-serif"],
        rubik: ["var(--font-rubik)"],
        mono: ["var(--font-geist-mono)"],
      },
    },
  },
  darkMode: "class",
  plugins: [require("@tailwindcss/forms"),require('@tailwindcss/typography'), heroui({ addCommonColors: true })],
}

export default config;

