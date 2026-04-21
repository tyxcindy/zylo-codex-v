"use client";

import { Moon, SunMedium } from "lucide-react";

import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-11 items-center gap-2 rounded-full border border-[color:var(--line)] bg-[color:var(--glass-bg)] px-3.5 text-sm font-semibold text-[color:var(--text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.42),0_18px_34px_rgba(24,32,51,0.1)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-[color:var(--glass-bg-strong)]"
      aria-label="Toggle theme"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/18 bg-white/18 text-[color:var(--text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.44)]">
        {theme === "light" ? <Moon className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
      </span>
      {theme === "light" ? "Dark" : "Light"}
    </button>
  );
}
