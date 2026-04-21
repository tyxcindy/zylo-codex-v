import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        muted: "hsl(var(--muted))",
        border: "hsl(var(--border))",
        accent: "hsl(var(--accent))",
        primary: "hsl(var(--primary))",
        secondary: "hsl(var(--secondary))"
      },
      backgroundImage: {
        "zylo-radial":
          "radial-gradient(circle at top left, rgba(240, 171, 0, 0.28), transparent 34%), radial-gradient(circle at bottom right, rgba(255, 61, 113, 0.22), transparent 28%), linear-gradient(135deg, rgba(10, 10, 15, 1) 0%, rgba(16, 24, 40, 0.96) 42%, rgba(30, 41, 59, 0.94) 100%)"
      },
      boxShadow: {
        glow: "0 30px 80px rgba(255, 98, 71, 0.16)",
        soft: "0 20px 60px rgba(15, 23, 42, 0.08)"
      },
      borderRadius: {
        xl: "1.25rem",
        "2xl": "1.75rem"
      }
    }
  },
  plugins: []
};

export default config;
