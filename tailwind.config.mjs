import { heroui } from "@heroui/theme";
import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#4f7269",
          light: "#688e86",
          dark: "#3f5a51",
        },
        background: {
          light: "#ffffff",
          dark: "#181818",
        },
        surface: {
          light: "#ffffff",
          dark: "#212124",
        },
        border: {
          light: "#e5e7eb",
          dark: "#3B3B3B",
        },
        text: {
          primary: {
            light: "#1f2937",
            dark: "#f9fafb",
          },
          secondary: {
            light: "#6b7280",
            dark: "#d1d5db",
          },
        },
      },
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
  plugins: [
    forms,
    typography,
    heroui({ addCommonColors: true }),
  ],
};

export default config;

