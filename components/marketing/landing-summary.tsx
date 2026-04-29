"use client";

import { ArrowRight, Clock3, HeartHandshake, Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { DestinationCarousel } from "@/components/ui/destination-carousel";

const summaryCards = [
  {
    title: "Why it exists",
    body: "Travel ideas should not disappear inside a giant pile of saved reels, screenshots, and random links.",
    icon: HeartHandshake,
    accent: "from-[#6a73ff] to-[#9e84ff]"
  },
  {
    title: "What works now",
    body: "Zylo already lets people manually import travel content, automatically extract and group, to browse them.",
    icon: Sparkles,
    accent: "from-[#ff7a59] to-[#ffb56c]"
  },
  {
    title: "What comes next",
    body: "Direct sync and cleaner route-building are next.",
    icon: Clock3,
    accent: "from-[#23c983] to-[#7be5b6]"
  }
];

const homepageCarouselItems = [
  {
    id: "marrakech",
    imageUrl:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
    title: "Marrakech",
    subtitle: "Rose walls, rooftop dinners, market lanes."
  },
  {
    id: "lofoten",
    imageUrl:
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80",
    title: "Lofoten",
    subtitle: "Quiet water, red cabins, cold Nordic light."
  },
  {
    id: "mexico-city",
    imageUrl:
      "https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=1200&q=80",
    title: "Mexico City",
    subtitle: "Trees, design hotels, cafe density, bold color."
  },
  {
    id: "cape-town",
    imageUrl:
      "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1200&q=80",
    title: "Cape Town",
    subtitle: "Ocean edges, mountain roads, modern stays."
  }
] as const;

export function LandingSummary() {
  return (
    <section className="page-shell space-y-10 pb-8 pt-2">
    <DestinationCarousel
      items={homepageCarouselItems}
      eyebrow="Product preview"
      title="Preview where your saves could take you"
      subtitle="A visual travel strip at the end of the homepage."
      className="mt-2"
    />
      <div className="home-panel px-6 py-8 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="space-y-5">
            <div>
              <p className="home-kicker">What's so good</p>
              <h2 className="home-title mt-3 text-4xl sm:text-5xl">
                A messy, disorganized saved reels to organzied itineraries.
              </h2>
            </div>
            <p className="home-copy max-w-2xl text-sm leading-8 sm:text-base">
              Do you ever save a billion reels of restaurants you want to try or places you want to visit or even trip hacks that you want to rewatch one day? But now you have too many reels saved, and it's too much to go through. What if you can connect your Instagram/TikTok accounts, and this app will take all your starred/saved/liked reels and then review and organize them for you by city, restaurants, scenic spots, activities, photo spots, and hotels.  
              If you want to learn more, head over to "<Link href="/how-it-works">Learn More.</Link>"
            </p>
            <div className="home-panel-muted px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--home-muted)]">
                Learn more path
              </p>
              <p className="mt-3 text-sm leading-7 text-[color:var(--home-soft)]">
                The detailed product story, future plans, and system specifics lives right on a
                dedicated route "<Link href="/how-it-works">Learn More.</Link>"
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
                    className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--brand)] text-white"
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
