import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        abyss: "#070A12",
        panel: "#101624",
        panelLight: "#171F31",
        volt: "#B8FF4B",
        ember: "#FF6B3D",
        arcane: "#8B5CF6",
        frost: "#42D6FF",
        muted: "#99A6B8"
      },
      boxShadow: {
        glow: "0 0 42px rgba(66, 214, 255, 0.14)",
        card: "0 18px 48px rgba(0, 0, 0, 0.28)"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui"]
      }
    }
  },
  plugins: []
};

export default config;
