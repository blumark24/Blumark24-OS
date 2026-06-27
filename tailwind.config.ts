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
        // Sprint 2B premium palette — additive. Existing `brand.*`
        // classes continue to work; new components opt-in via `premium.*`.
        premium: {
          "navy-deep": "#020817",
          "navy-midnight": "#071426",
          "navy-royal": "#0B1F3A",
          "blue-electric": "#147CFF",
          "cyan-cyber": "#00D9FF",
          "blue-ice": "#7DDCFF",
          "violet-ai": "#7C3AED",
          emerald: "#10B981",
          amber: "#F59E0B",
          red: "#EF4444",
          "text-muted": "#94A3B8",
          "text-primary": "#F8FAFC",
        },
      },
      screens: {
        // Additive. Tailwind's default `sm`/`md`/`lg`/`xl`/`2xl` remain.
        // Premium breakpoints expose the documented mobile→wide ranges.
        "premium-mobile": "360px",
        "premium-tablet": "768px",
        "premium-laptop": "1280px",
        "premium-desktop": "1440px",
        "premium-wide": "1920px",
      },
      spacing: {
        "premium-1": "4px",
        "premium-2": "8px",
        "premium-3": "12px",
        "premium-4": "16px",
        "premium-5": "20px",
        "premium-6": "24px",
        "premium-8": "32px",
        "premium-10": "40px",
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
        "premium-md": "12px",
        "premium-lg": "16px",
        "premium-xl": "24px",
        "premium-2xl": "32px",
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
