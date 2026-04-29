import Image from "next/image";

import { useTheme } from "@/components/theme-provider";

export function Logo({ dark = false, compact = false }: { dark?: boolean; compact?: boolean }) {
  const { theme } = useTheme();
  const isDark = dark || theme === "dark";
  const logoSrc = isDark ? "/zylo-logo-dark.svg" : "/zylo-logo.png";

  return (
    <div className="flex items-center gap-3">
      <div
        className={`theme-dot relative flex ${compact ? "h-12 w-12 rounded-[20px]" : "h-14 w-14 rounded-[22px]"} items-center justify-center overflow-hidden border shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_18px_34px_rgba(15,23,42,0.14)] ${
          isDark ? "border-white/12 bg-[rgba(255,255,255,0.06)]" : "border-white/60 bg-[rgba(255,255,255,0.72)]"
        }`}
      >
        <div className="absolute inset-[1px] rounded-[inherit] border border-white/18" />
        <div className="relative h-[84%] w-[84%]">
          <Image
            src={logoSrc}
            alt="Zylo logo"
            fill
            sizes={compact ? "48px" : "56px"}
            className="object-contain"
            priority
          />
        </div>
      </div>
      <div>
        <p
          className={`text-[1.9rem] leading-none tracking-[0.05em] ${isDark ? "text-white" : "text-[color:var(--text)]"}`}
          style={{ fontFamily: "var(--font-logo)", fontWeight: 600 }}
        >
          Zylo
        </p>
        {!compact ? (
          <p className={`text-xs tracking-[0.08em] ${isDark ? "text-white/72" : "text-[color:var(--text-soft)]"}`}>
            You save it. Zylo plans it.
          </p>
        ) : null}
      </div>
    </div>
  );
}
