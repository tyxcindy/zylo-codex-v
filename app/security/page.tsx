import { auditEvents } from "@/lib/data";

export default function SecurityPage() {
  return (
    <div className="page-shell py-12">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--text-soft)]">
          Security
        </p>
        <h1 className="mt-4 text-5xl">Built for real users, not demo shortcuts.</h1>
        <p className="mt-5 text-base leading-8 text-[color:var(--text-soft)]">
          Zylo’s public-beta foundation includes secure session expectations, strict
          API validation, ownership checks, rate limits, signed uploads, and
          environment-only secrets.
        </p>
      </div>
      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        {[
          "Managed authentication with email verification, expiring sessions, and password reset hygiene",
          "Ownership checks on every resource path to prevent IDOR issues",
          "Rate limits across auth, imports, AI generation, and search",
          "Structured audit events and anomaly alerts for unusual behavior"
        ].map((item) => (
          <div key={item} className="glass-panel p-6">
            <p className="text-sm leading-7 text-[color:var(--text)]">{item}</p>
          </div>
        ))}
      </div>
      <div className="glass-panel mt-8 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--text-soft)]">
          Recent audit samples
        </p>
        <div className="mt-5 space-y-4">
          {auditEvents.map((event) => (
            <div key={event.id} className="flex flex-col gap-1 border-b border-[color:var(--line)] pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[color:var(--text)]">{event.message}</p>
                <p className="text-xs text-[color:var(--text-soft)]">{event.type}</p>
              </div>
              <p className="text-xs text-[color:var(--text-soft)]">{event.timestamp}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
