import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-space-grotesk)", "var(--font-inter)", "sans-serif"],
      },
      colors: {
        // Pinecone-inspired bright, high-trust palette
        ink: {
          DEFAULT: "#0B1120",
          muted: "#475569",
          subtle: "#64748B",
        },
        brand: {
          50: "#ecfdf6",
          100: "#d1faec",
          200: "#a7f3da",
          300: "#6ee7bf",
          400: "#34d3a3",
          500: "#10b88a",
          600: "#069471",
          700: "#06765d",
          800: "#085d4b",
          900: "#084c3f",
        },
        accent: {
          50: "#eef4ff",
          100: "#dbe6fe",
          200: "#bfd2fe",
          300: "#93b4fd",
          400: "#608bfa",
          500: "#3b66f5",
          600: "#2548ea",
          700: "#1d37d7",
          800: "#1e30ae",
          900: "#1e2e89",
        },
        surface: {
          DEFAULT: "#ffffff",
          subtle: "#f8fafc",
          muted: "#f1f5f9",
        },
        line: {
          DEFAULT: "#e6eaf0",
          strong: "#d4dae3",
        },
        status: {
          pass: "#06966f",
          fail: "#dc2626",
          warn: "#d97706",
          info: "#2548ea",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.06)",
        "card-lg": "0 4px 6px -2px rgba(16, 24, 40, 0.03), 0 12px 16px -4px rgba(16, 24, 40, 0.08)",
        glow: "0 0 0 4px rgba(16, 184, 138, 0.12)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out both",
        "pulse-dot": "pulse-dot 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
