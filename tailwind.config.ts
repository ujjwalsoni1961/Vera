import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Page + surfaces
        page: "#FAFAFA",
        surface: "#FFFFFF",
        // Borders
        line: "#ECECEC",
        "line-strong": "#E0E0E0",
        // Text
        ink: {
          DEFAULT: "#18181B",
          secondary: "#52525B",
          muted: "#A1A1AA",
          faint: "#D4D4D8",
        },
        // Single calm accent
        accent: {
          DEFAULT: "#2563EB",
          hover: "#1D4ED8",
          soft: "#EFF4FE",
          softer: "#F6F9FF",
          border: "#D6E2FB",
        },
        // Status (dots only, never loud)
        ok: "#16A34A",
        warn: "#D97706",
        bad: "#DC2626",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: [
          "var(--font-jetbrains)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      borderRadius: {
        card: "12px",
      },
      boxShadow: {
        "card-hover": "0 2px 8px rgba(24, 24, 27, 0.06)",
        popover:
          "0 4px 16px rgba(24, 24, 27, 0.08), 0 1px 3px rgba(24, 24, 27, 0.05)",
      },
      fontSize: {
        xxs: ["11px", "16px"],
      },
    },
  },
  plugins: [],
};

export default config;
