"use client";

import { motion } from "framer-motion";
import { LockKeyhole, ShieldCheck } from "lucide-react";

export function SecurityTrust() {
  return (
    <section className="page-shell py-14">
      <div className="grid gap-4 lg:grid-cols-[0.88fr_1.12fr]">
        <div className="home-panel p-7">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7a84ff]/16 text-[#c9d1ff]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <p className="home-kicker mt-6">Security posture</p>
          <h2 className="home-title mt-4 text-4xl">Fast launch, not sloppy launch.</h2>
          <p className="home-copy mt-4 max-w-lg text-sm leading-7">
            Even with the more cinematic surface, the trust layer still needs to read cleanly: protected auth, tight upload controls, and deliberate AI boundaries.
          </p>
        </div>
        <div className="home-panel p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--home-muted)]">Active safeguards</p>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#23c983]/30 bg-[#23c983]/12 px-3 py-1 text-xs font-semibold text-[#86ecc5]">
              <LockKeyhole className="h-3.5 w-3.5" />
              monitored
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              "Managed auth with expiring sessions, verification, and reset hygiene",
              "Signed uploads, server-only secrets, and strict input validation",
              "Ownership checks and rate limits across auth, imports, and AI",
              "Security headers, audit logs, anomaly alerts, and no unofficial sync scraping"
            ].map((item, index) => (
              <motion.div
                key={item}
                className="home-panel-muted flex items-start gap-3 p-4"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.35, delay: index * 0.06 }}
              >
                <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[#7a84ff]" />
                <p className="text-sm leading-7 text-[color:var(--home-soft)]">{item}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
