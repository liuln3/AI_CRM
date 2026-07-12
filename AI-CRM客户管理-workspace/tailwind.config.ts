import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        apple: "#0071e3",
        link: "#0066cc",
        signal: "#2997ff",
        carbon: "#1d1d1f",
        frost: "#f5f5f7",
        ice: "#f4f8fb",
        smoke: "#333333",
        graphite: "#474747",
        ash: "#707070",
        mist: "#858585",
        onyx: "#000000",
        pebble: "#e2e2e5",
        hairline: "#d2d2d7",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "SF Pro Display",
          "Inter",
          "system-ui",
          "Segoe UI",
          "PingFang SC",
          "Hiragino Sans GB",
          "Microsoft YaHei",
          "sans-serif",
        ],
      },
      borderRadius: {
        pill: "980px",
      },
      letterSpacing: {
        tightest: "-0.022em",
        tighter: "-0.016em",
        tight: "-0.011em",
      },
    },
  },
  plugins: [],
};

export default config;
