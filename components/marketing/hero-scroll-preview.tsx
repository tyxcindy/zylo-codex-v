"use client";

import { motion } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";
import Link from "next/link";

import { useTheme } from "@/components/theme-provider";
import ScrollExpansionHero from "@/components/ui/scroll-expansion-hero";
import { Button } from "@/components/ui/button";

const savedReels = [
  ["https://www.instagram.com/reel/tokyo-ramen", "link"],
  ["Top cafes in Paris: Cafe de Flore, Fragments, Telescope", "text"],
  ["Santorini screenshot dump", "image"],
  ["https://www.tiktok.com/@travel/video/123", "link"]
] as const;

const filteredPlaces = ["Ichiran Ramen", "Shibuya Sky"];

const homeHeroMedia = {
  media: {
    light: "/videos/hero-light-mode.mp4",
    dark: "/videos/hero-dark-mode.mp4"
  },
  background: {
    light:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2200&q=80",
    dark:
      "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=2200&q=80"
  }
} as const;

export function HeroScrollPreview() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <ScrollExpansionHero
      mediaType="video"
      mediaSrc={homeHeroMedia.media}
      bgImageSrc={homeHeroMedia.background}
      title="You save it, Zylo plans it"
      titleLines={["You save it", "Zylo plan it"]}
      date="Manual Import First"
      scrollToExpand="Links, text, screenshots. Scroll to preview the product."
    >
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <div className="glass-panel p-6 sm:p-8">
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

          <div className="mt-6 grid gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <div className="space-y-5">
              <h2 className="home-title text-[2.8rem] leading-[0.9] sm:text-[4rem]">Your saved travel stash, turned into a usable plan.</h2>
              <p className="home-copy max-w-2xl text-base leading-8 sm:text-lg">
                Turn saved reels, pasted captions, screenshots, and food finds into organized places,
                destination boards, maps, and trip plans you can actually use.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/onboarding">
                    Start free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/how-it-works">Learn more</Link>
                </Button>
              </div>
            </div>

            <div className="home-panel p-5 sm:p-6">
              <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
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
                                ? isDark
                                  ? "border border-emerald-300/20 bg-[#23c983]/18 text-[#b5f3d8]"
                                  : "border border-emerald-500/18 bg-emerald-500/10 text-emerald-700"
                                : state === "text"
                                  ? isDark
                                    ? "border border-orange-300/20 bg-[#ff7a59]/18 text-[#ffd9cd]"
                                    : "border border-orange-500/18 bg-orange-500/10 text-orange-700"
                                  : isDark
                                    ? "border border-white/8 bg-black/8 text-[color:var(--home-muted)]"
                                    : "border border-black/8 bg-black/6 text-slate-600"
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
                  <p className="hero-display-readable mt-4 max-w-[13ch] text-[1.9rem] font-semibold leading-[0.92] tracking-[-0.02em] sm:max-w-[340px] sm:text-[2.35rem]">
                    Finds the real places hiding inside your saved content.
                  </p>
                  <p className="mt-4 max-w-md text-sm leading-7 text-[color:var(--home-soft)]">
                    Filters all your saved reels from doomscrolling and organize them by destination. Explore all places saved through maps, trip boards, and itinerary planning.
                  </p>
                  <div className="hero-extraction-panel relative mt-8 overflow-hidden rounded-[26px] border border-[color:var(--home-line)] p-4 sm:p-5">
                    <div className="hero-extraction-grid pointer-events-none absolute inset-0 opacity-35" />
                    <div className="pointer-events-none absolute -right-10 top-3 h-24 w-24 rounded-full bg-[#8b84ff]/12 blur-3xl" />
                    <div className="pointer-events-none absolute bottom-0 left-10 h-20 w-20 rounded-full bg-[#ff9875]/10 blur-3xl" />
                    <div className="relative flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-[0.2em] text-[color:var(--home-muted)]">
                      <span>Extraction pipeline</span>
                      <span className="inline-flex items-center gap-2 text-[#6be0b3]">
                        <span className="pulse-dot h-2 w-2 rounded-full bg-current" />
                        live
                      </span>
                    </div>
                    <div className="relative mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {filteredPlaces.map((item, index) => (
                        <div
                          key={item}
                          className="hero-extraction-card rounded-[22px] border border-[color:var(--home-line)] px-3 py-3.5 sm:px-4"
                        >
                          <p className="text-wrap-words text-balance text-[0.92rem] font-semibold leading-7 text-[color:var(--home-text)] sm:text-base">
                            {item}
                          </p>
                          <div className="hero-extraction-track mt-3 h-2 rounded-full">
                            <motion.div
                              className="h-full rounded-full bg-gradient-to-r from-[#0022ff] via-[#ff46e0] to-[#ff13d8]"
                              animate={{ width: ["24%", "78%", "95%", "56%"] }}
                              transition={{ duration: 4.2 + index, repeat: Infinity, ease: "easeInOut" }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScrollExpansionHero>
  );
}
