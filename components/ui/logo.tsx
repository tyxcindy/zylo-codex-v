export function Logo({ dark = false, compact = false }: { dark?: boolean; compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`theme-dot relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-[18px] border shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_18px_34px_rgba(15,23,42,0.18)] ${
          dark ? "border-white/16 bg-white/10" : "border-white/60 bg-[rgba(255,255,255,0.52)]"
        }`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(122,132,255,1),transparent_44%),radial-gradient(circle_at_bottom_right,rgba(255,122,89,.95),transparent_38%),linear-gradient(135deg,rgba(9,17,35,.92),rgba(42,52,96,.78))]" />
        <div className="absolute inset-[1px] rounded-[16px] border border-white/12" />
        <span className="relative text-lg font-black tracking-tight text-white">Z</span>
      </div>
      <div>
        <p className={`text-lg font-black tracking-tight ${dark ? "text-white" : "text-[color:var(--text)]"}`}>
          Zylo
        </p>
        {!compact ? (
          <p className={`text-xs ${dark ? "text-white/72" : "text-[color:var(--text-soft)]"}`}>
            You save it. Zylo plans it.
          </p>
        ) : null}
      </div>
    </div>
  );
}
