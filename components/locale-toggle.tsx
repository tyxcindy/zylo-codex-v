"use client";

import { useLocale } from "@/components/locale-provider";
import { type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const options: Array<{ locale: Locale; key: "en" | "zh" }> = [
  { locale: "en", key: "en" },
  { locale: "zh-CN", key: "zh" }
];

export function LocaleToggle() {
  const { locale, setLocale, messages } = useLocale();

  return (
    <div
      className="inline-flex items-center gap-1 rounded-full border border-[color:var(--line)] bg-[color:var(--glass-bg)] p-1 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.42),0_18px_34px_rgba(24,32,51,0.1)] backdrop-blur-xl"
      aria-label={messages.locale.label}
      role="group"
    >
      {options.map((option) => {
        const active = locale === option.locale;
        return (
          <button
            key={option.locale}
            type="button"
            onClick={() => setLocale(option.locale)}
            className={cn(
              "rounded-full px-3 py-2 font-semibold transition",
              active
                ? "bg-[linear-gradient(135deg,var(--brand)_0%,color-mix(in_srgb,var(--brand)_72%,white)_100%)] text-white shadow-[0_14px_24px_rgba(91,104,255,0.24)]"
                : "text-[color:var(--text-soft)] hover:text-[color:var(--text)]"
            )}
          >
            {messages.locale[option.key]}
          </button>
        );
      })}
    </div>
  );
}
