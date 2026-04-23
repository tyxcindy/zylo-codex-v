"use client";

import { ArrowRight, Clock3, HeartHandshake, Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const summaryCards = [
  {
    title: "Why it exists",
    body: "Travel ideas should not disappear inside a giant pile of saved reels, screenshots, and random links.",
    icon: HeartHandshake,
    accent: "from-[#6a73ff] to-[#9e84ff]"
  },
  {
    title: "What works now",
    body: "Zylo already lets people manually import travel content, extract real places, group them by destination, and browse them in a dashboard.",
    icon: Sparkles,
    accent: "from-[#ff7a59] to-[#ffb56c]"
  },
  {
    title: "What comes next",
    body: "Direct sync, better itinerary flow, and cleaner route-building are next, but the homepage does not need to explain every implementation detail.",
    icon: Clock3,
    accent: "from-[#23c983] to-[#7be5b6]"
  }
];

export function LandingSummary() {
  return (
    <section className="page-shell pb-20 pt-6">
      <div className="home-panel px-6 py-8 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="space-y-5">
            <div>
              <p className="home-kicker">Why a normal person should care</p>
              <h2 className="home-title mt-3 text-4xl sm:text-5xl">
                A calmer front door. The deeper story can live elsewhere.
              </h2>
            </div>
            <p className="home-copy max-w-2xl text-sm leading-8 sm:text-base">
              The landing page should answer the basic civilian questions quickly: what Zylo is,
              why it exists, what it does right now, and where it is headed next. If someone wants
              the full roadmap or the investor-style specifics, that belongs on a separate page.
            </p>
            <div className="home-panel-muted px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--home-muted)]">
                Learn more path
              </p>
              <p className="mt-3 text-sm leading-7 text-[color:var(--home-soft)]">
                The detailed product story, future plans, and system specifics now live behind a
                dedicated route instead of crowding the homepage.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/dashboard">
                  Open Zylo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/how-it-works">Learn more</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {summaryCards.map((card) => {
              const Icon = card.icon;

              return (
                <div key={card.title} className="home-panel-muted p-5">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${card.accent} text-white`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-xl font-black text-[color:var(--home-text)]">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--home-soft)]">
                    {card.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
