import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          darkest: "#0a1628",
          dark: "#0d1f3c",
          mid: "#142844",
          light: "#1a3356",
          teal: "#22d3ee",
          blue: "#1e6fd9",
          orange: "#ff7a3d",
          border: "#1e3a5f",
          muted: "#8ba3c7",
        },
      },
      fontFamily: {
        arabic: ["IBM Plex Sans Arabic", "Tajawal", "sans-serif"],
        heading: ["Tajawal", "IBM Plex Sans Arabic", "sans-serif"],
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg, #0a1628 0%, #142844 100%)",
        "gradient-card": "linear-gradient(135deg, rgba(20,40,68,0.8) 0%, rgba(10,22,40,0.9) 100%)",
        "gradient-teal": "linear-gradient(135deg, #22d3ee 0%, #1e6fd9 100%)",
        "gradient-orange": "linear-gradient(135deg, #ff7a3d 0%, #ff5722 100%)",
      },
      animation: {
        "float-slow": "floatSlow 6s ease-in-out infinite",
        "float-mid": "floatMid 4s ease-in-out infinite",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
        "jellyfish": "jellyfish 8s ease-in-out infinite",
      },
      keyframes: {
        floatSlow: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-20px) rotate(5deg)" },
        },
        floatMid: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-12px) rotate(-3deg)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
        },
        jellyfish: {
          "0%, 100%": { transform: "translateY(0px) scaleX(1)" },
          "25%": { transform: "translateY(-15px) scaleX(1.05)" },
          "75%": { transform: "translateY(8px) scaleX(0.95)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      borderRadius: {
        "2xl": "16px",
      },
      boxShadow: {
        "glow-teal": "0 0 20px rgba(34,211,238,0.3)",
        "glow-blue": "0 0 20px rgba(30,111,217,0.3)",
        "glow-orange": "0 0 20px rgba(255,122,61,0.3)",
        "card": "0 4px 24px rgba(0,0,0,0.4)",
      },
    },
  },
  plugins: [],
};
export default config;
