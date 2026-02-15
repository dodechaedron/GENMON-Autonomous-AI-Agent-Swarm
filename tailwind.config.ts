import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cyan: { DEFAULT: "#00FFFF", 400: "#00CCCC", 600: "#009999" },
        purple: { DEFAULT: "#BF00FF", 400: "#9900CC", 600: "#7700AA" },
        pink: { DEFAULT: "#FF00AA", 400: "#CC0088", 600: "#AA0066" },
        space: { DEFAULT: "#0A0A0F", light: "#12121A", lighter: "#1A1A2E" },
      },
      fontFamily: {
        sans: ["Space Grotesk", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
