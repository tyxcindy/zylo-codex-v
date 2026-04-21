"use client";

import { motion } from "framer-motion";
import { ArrowRightLeft, FolderTree, Route } from "lucide-react";

export function RoadmapTeaser() {
  return (
    <section className="page-shell py-14">
      <div className="home-panel overflow-hidden px-6 py-8 sm:px-10">
        <div className="grid gap-8 xl:grid-cols-[0.98fr_1.02fr] xl:items-center">
          <div>
            <div className="flex flex-wrap gap-3">
              {["Direct sync", "Creator folders", "Shareable routes"].map((chip, index) => (
                <motion.span
                  key={chip}
                  className="home-pill rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 3.8 + index * 0.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  {chip}
                </motion.span>
              ))}
            </div>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--home-muted)]">
              Roadmap
            </p>
            <h2 className="mt-4 max-w-[12ch] text-4xl font-black text-[color:var(--home-text)] sm:text-5xl">
              Direct IG/TikTok sync is next.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[color:var(--home-soft)]">
              Launch focuses on imports Zylo can fully control today. Direct sync rolls out later
              through compliant, durable integrations instead of brittle hacks.
            </p>
            <div className="mt-8 max-w-xl rounded-full bg-black/8 p-2">
              <motion.div
                className="h-3 rounded-full bg-gradient-to-r from-[#8b84ff] via-[#ff9875] to-[#49d3a0]"
                initial={{ width: "26%" }}
                whileInView={{ width: ["26%", "68%", "54%"] }}
                viewport={{ once: true }}
                transition={{ duration: 3.2, ease: "easeInOut" }}
              />
            </div>
          </div>

          <div className="home-panel-muted relative p-5 sm:p-6">
            <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
              <div className="rounded-[28px] border border-[color:var(--home-line)] bg-[color:var(--home-well)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--home-muted)]">
                  Today
                </p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-[20px] border border-[color:var(--home-line)] bg-[color:var(--home-panel-muted-bg)] px-4 py-3">
                    <p className="text-sm font-semibold text-[color:var(--home-text)]">Manual import</p>
                  </div>
                  <div className="rounded-[20px] border border-[color:var(--home-line)] bg-[color:var(--home-panel-muted-bg)] px-4 py-3">
                    <p className="text-sm font-semibold text-[color:var(--home-text)]">Place extraction</p>
                  </div>
                  <div className="rounded-[20px] border border-[color:var(--home-line)] bg-[color:var(--home-panel-muted-bg)] px-4 py-3">
                    <p className="text-sm font-semibold text-[color:var(--home-text)]">Destination boards</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-[color:var(--home-line)] bg-[color:var(--home-panel-muted-bg)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--home-muted)]">
                  Potential future view
                </p>
                <div className="mt-4 rounded-[24px] border border-[color:var(--home-line)] bg-[color:var(--home-well)] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[color:var(--home-text)]">Connected sync</p>
                      <p className="mt-1 text-xs text-[color:var(--home-muted)]">Instagram + TikTok</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8b84ff] to-[#49d3a0] text-white">
                      <ArrowRightLeft className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-5 space-y-3">
                    <div className="flex items-center gap-3 rounded-[20px] border border-[color:var(--home-line)] bg-[color:var(--home-panel-muted-bg)] px-4 py-3">
                      <FolderTree className="h-4 w-4 text-[#8b84ff]" />
                      <p className="text-sm font-semibold text-[color:var(--home-text)]">Creator folders auto-sort into destinations</p>
                    </div>
                    <div className="flex items-center gap-3 rounded-[20px] border border-[color:var(--home-line)] bg-[color:var(--home-panel-muted-bg)] px-4 py-3">
                      <Route className="h-4 w-4 text-[#ff9875]" />
                      <p className="text-sm font-semibold text-[color:var(--home-text)]">Trip routes update as new places land</p>
                    </div>
                  </div>
                  <div className="mt-5 h-28 rounded-[24px] border border-[color:var(--home-line)] bg-[radial-gradient(circle_at_20%_24%,rgba(139,132,255,0.28),transparent_24%),radial-gradient(circle_at_78%_72%,rgba(255,152,117,0.24),transparent_28%),linear-gradient(180deg,rgba(20,24,34,0.82),rgba(15,18,26,0.86))] p-4">
                    <div className="flex h-full items-end justify-between">
                      {[38, 62, 48].map((height, index) => (
                        <div
                          key={height}
                          className="w-[29%] rounded-[18px] bg-gradient-to-t from-[#8b84ff] via-[#ff9875] to-[#49d3a0] opacity-90"
                          style={{ height: `${height}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
