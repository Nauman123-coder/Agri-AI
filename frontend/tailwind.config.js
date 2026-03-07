/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        soil: {
          950: "#0A0A0A",
          900: "#111111",
          800: "#1A1A1A",
          700: "#242424",
          600: "#2E2E2E",
        },
        khet: {
          50: "#f0fff8",
          100: "#ccffe8",
          200: "#99ffd1",
          300: "#66ffba",
          400: "#33ffa3",
          500: "#00FF7F",
          600: "#00cc66",
          700: "#00994d",
          800: "#006633",
          900: "#00331a",
        },
        harvest: {
          gold: "#FFD700",
          amber: "#FF8C00",
          red: "#FF3B30",
          blue: "#007AFF",
        }
      },
      fontFamily: {
        display: ["'Syne'", "sans-serif"],
        body: ["'DM Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
        urdu: ["'Noto Nastaliq Urdu'", "serif"],
      },
      backgroundImage: {
        "soil-gradient": "linear-gradient(135deg, #0A0A0A 0%, #141414 50%, #0D1A10 100%)",
        "khet-glow": "radial-gradient(ellipse at center, rgba(0,255,127,0.15) 0%, transparent 70%)",
        "card-shine": "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)",
      },
      boxShadow: {
        "khet": "0 0 20px rgba(0,255,127,0.3), 0 0 60px rgba(0,255,127,0.1)",
        "khet-sm": "0 0 10px rgba(0,255,127,0.2)",
        "card": "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
        "card-hover": "0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)",
      },
      animation: {
        "pulse-green": "pulse-green 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
        "scan": "scan 2s linear infinite",
      },
      keyframes: {
        "pulse-green": {
          "0%, 100%": { boxShadow: "0 0 10px rgba(0,255,127,0.3)" },
          "50%": { boxShadow: "0 0 25px rgba(0,255,127,0.7)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "scan": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        }
      }
    },
  },
  plugins: [],
};
