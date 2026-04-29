"use client";

import { Moon, SunMedium } from "lucide-react";

import { useLocale } from "@/components/locale-provider";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const { messages } = useLocale();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex h-11 items-center rounded-full border border-[color:var(--line)] bg-[color:var(--glass-bg)] text-sm font-semibold text-[color:var(--text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.42),0_14px_28px_rgba(24,32,51,0.08)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-[color:var(--glass-bg-strong)] ${
        compact ? "justify-center px-0 w-11" : "gap-2 px-3.5"
      }`}
      aria-label={messages.theme.toggle}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/18 bg-white/18 text-[color:var(--text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.44)]">
        {theme === "light" ? <Moon className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
      </span>
      {compact ? null : theme === "light" ? messages.theme.dark : messages.theme.light}
    </button>
  );
}
