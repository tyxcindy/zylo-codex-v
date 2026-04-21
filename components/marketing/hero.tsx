"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

import { Button } from "@/components/ui/button";

const savedReels = [
  ["https://www.instagram.com/reel/tokyo-ramen", "link"],
  ["Top cafes in Paris: Cafe de Flore, Fragments, Telescope", "text"],
  ["Santorini screenshot dump", "image"],
  ["https://www.tiktok.com/@travel/video/123", "link"]
] as const;

const filteredPlaces = ["Ichiran Ramen", "teamLab Planets", "Shibuya Sky"];

export function Hero() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"]
  });
  const leftY = useTransform(scrollYProgress, [0, 1], [0, -36]);
  const rightY = useTransform(scrollYProgress, [0, 1], [0, 58]);

  return (
    <section ref={sectionRef} className="page-shell relative pb-10 pt-12 sm:pt-16">
      <div className="grid gap-10 xl:grid-cols-[0.88fr_1.12fr] xl:items-center">
        <motion.div className="hero-copy-card space-y-7 xl:pr-4" style={{ y: leftY }}>
          <div className="flex flex-wrap items-center gap-3">
            <span className="home-pill inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em]">
              <span className="animated-ring h-2.5 w-2.5 rounded-full bg-[#6be0b3]" />
              manual import first
            </span>
            <span className="home-pill inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em]">
              <Search className="h-3.5 w-3.5" />
              links, text, screenshots
            </span>
          </div>

          <motion.h1
            className="home-title hero-display-readable max-w-3xl text-[clamp(3.9rem,8vw,5.1rem)] leading-[0.95]"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            You save it.
            <br />
            Zylo plans it.
          </motion.h1>

          <motion.p
            className="home-copy max-w-2xl text-base leading-8 sm:text-lg"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
          >
            Turn saved reels, pasted captions, screenshots, and food finds into organized places,
            destination boards, maps, and trip plans you can actually use.
          </motion.p>

          <motion.div
            className="flex flex-col gap-3 sm:flex-row"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.14 }}
          >
            <Button asChild size="lg">
              <Link href="/onboarding">
                Start free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/how-it-works">Learn more</Link>
            </Button>
          </motion.div>
        </motion.div>

        <motion.div className="space-y-4" id="see-it-work" style={{ y: rightY }}>
          <motion.div
            className="home-panel p-5 sm:p-6"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.12 }}
          >
            <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="home-panel-muted p-4 sm:p-5">
                <p className="text-sm font-semibold text-[color:var(--home-text)]">Incoming travel content</p>
                <div className="mt-4 space-y-3">
                  {savedReels.map(([label, state], index) => (
                    <motion.div
                      key={label}
                      className="rounded-[22px] border border-[color:var(--home-line)] bg-[color:var(--home-well)] px-4 py-3 text-sm text-[color:var(--home-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
                      animate={{ x: [0, state === "link" ? 3 : -2, 0] }}
                      transition={{ duration: 4.8 + index * 0.35, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--home-muted)]">source input</div>
                          <div className="text-wrap-safe mt-1 max-w-full pr-1 text-[color:var(--home-text)]">
                            {label}
                          </div>
                        </div>
                        <span
                          className={`shrink-0 self-start rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] sm:self-center ${
                            state === "link"
                              ? "border border-emerald-500/18 bg-emerald-500/10 text-emerald-700 dark:border-emerald-300/20 dark:bg-[#23c983]/18 dark:text-[#b5f3d8]"
                              : state === "text"
                                ? "border border-orange-500/18 bg-orange-500/10 text-orange-700 dark:border-orange-300/20 dark:bg-[#ff7a59]/18 dark:text-[#ffd9cd]"
                                : "border border-black/8 bg-black/6 text-slate-600 dark:border-white/8 dark:bg-black/8 dark:text-[color:var(--home-muted)]"
                          }`}
                        >
                          {state}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="mesh-card relative rounded-[30px] border border-[color:var(--home-line)] p-5 text-[color:var(--home-text)] shadow-[var(--glass-shadow)]">
                <div className="scan-line" />
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--home-muted)]">personal filter view</p>
                  <span className="rounded-full border border-[color:var(--home-line)] bg-[color:var(--home-chip-bg)] px-3 py-1 text-[11px] font-medium text-[color:var(--home-muted)]">
                    dedupe live
                  </span>
                  <span className="rounded-full border border-[color:var(--home-line)] bg-[color:var(--home-chip-bg)] px-3 py-1 text-[11px] font-medium text-[color:var(--home-muted)]">
                    places only
                  </span>
                </div>
                <p className="hero-display-readable mt-4 max-w-[13ch] text-[2.2rem] font-black leading-[0.96] tracking-[-0.02em] sm:max-w-[340px] sm:text-[2.7rem] lg:text-[3.3rem]">
                  Finds the real places hiding inside your saved content.
                </p>
                <p className="mt-4 max-w-md text-sm leading-7 text-[color:var(--home-soft)]">
                  The source stays internal. The user sees place cards, destinations, maps, and
                  trip boards instead of going back through raw links.
                </p>
                <div className="relative mt-8 overflow-hidden rounded-[26px] border border-[color:var(--home-line)] bg-[radial-gradient(circle_at_18%_18%,rgba(122,132,255,0.14),transparent_24%),radial-gradient(circle_at_84%_78%,rgba(255,122,89,0.12),transparent_28%),linear-gradient(180deg,rgba(16,19,29,0.88),rgba(20,18,27,0.92))] p-4">
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:64px_64px] opacity-35" />
                  <div className="pointer-events-none absolute -right-10 top-3 h-24 w-24 rounded-full bg-[#8b84ff]/12 blur-3xl" />
                  <div className="pointer-events-none absolute bottom-0 left-10 h-20 w-20 rounded-full bg-[#ff9875]/10 blur-3xl" />
                  <div className="relative flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-[0.2em] text-[color:var(--home-muted)]">
                    <span>Extraction pipeline</span>
                    <span className="inline-flex items-center gap-2 text-[#6be0b3]">
                      <span className="pulse-dot h-2 w-2 rounded-full bg-current" />
                      live
                    </span>
                  </div>
                  <div className="relative mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredPlaces.map((item, index) => (
                      <div
                        key={item}
                        className="rounded-[22px] border border-[color:var(--home-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] px-4 py-4"
                      >
                        <p className="text-wrap-words text-balance text-[0.95rem] font-semibold leading-7 text-[color:var(--home-text)] sm:text-base lg:text-[0.95rem] xl:text-base">
                          {item}
                        </p>
                        <div className="mt-3 h-2 rounded-full bg-black/6">
                          <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-[#7a84ff] via-[#ff7a59] to-[#23c983]"
                            animate={{ width: ["24%", "78%", "56%"] }}
                            transition={{ duration: 4.2 + index, repeat: Infinity, ease: "easeInOut" }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
