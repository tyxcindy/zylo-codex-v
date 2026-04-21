import { ArrowUpRight, Clock3, Link2, Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import type { Destination, Place, SourceArtifact, Trip } from "@/lib/domain";

export function DashboardOverview({
  destinations,
  places,
  sourceArtifacts,
  trips
}: {
  destinations: Destination[];
  places: Place[];
  sourceArtifacts: SourceArtifact[];
  trips: Trip[];
}) {
  return (
    <div className="space-y-6">
      <div className="app-card flex flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--app-text-soft)]">
            Fastest way in
          </p>
          <h2 className="mt-3 text-3xl font-black text-[color:var(--app-text)]">Import another reel, post, or caption.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--app-text-soft)]">
            Until Instagram sync ships, use Import to paste a reel link, a TikTok URL, caption text,
            or screenshot notes and turn them into saved places.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="primary">
            <Link href="/import">
              <Link2 className="h-4 w-4" />
              Open import
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/search">Search saved places</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            label: "Saved places",
            value: places.length.toString().padStart(2, "0"),
            note: "Across live destinations"
          },
          {
            label: "Active imports",
            value: sourceArtifacts.length.toString().padStart(2, "0"),
            note: "Recent saves still processing"
          },
          {
            label: "Trip drafts",
            value: trips.length.toString().padStart(2, "0"),
            note: "Ready for route planning"
          }
        ].map((stat) => (
          <div key={stat.label} className="app-card px-5 py-5">
            <p className="text-sm text-[color:var(--app-text-soft)]">{stat.label}</p>
            <p className="mt-3 text-4xl font-black text-[color:var(--app-text)]">{stat.value}</p>
            <p className="mt-2 text-sm text-[color:var(--app-text-soft)]">{stat.note}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="app-card px-6 py-6">
          <div className="flex items-center gap-3 text-sm text-[color:var(--app-text-soft)]">
            <Sparkles className="h-4 w-4" />
            Repeat-save radar
          </div>
          <div className="mt-6 space-y-4">
            {places
              .filter((place) => place.timesSeen > 2)
              .map((place) => (
                <div
                  key={place.id}
                  className="app-card-soft flex items-center justify-between px-4 py-4"
                >
                  <div>
                    <p className="font-semibold text-[color:var(--app-text)]">{place.name}</p>
                    <p className="mt-1 text-sm text-[color:var(--app-text-soft)]">
                      {place.city} · {place.category}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-[color:var(--app-text)]">{place.timesSeen}x</p>
                    <p className="text-xs text-[color:var(--app-text-soft)]">saved again</p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="app-card px-6 py-6">
          <div className="flex items-center gap-3 text-sm text-[color:var(--app-text-soft)]">
            <Clock3 className="h-4 w-4" />
            Destinations in motion
          </div>
          <div className="mt-6 grid gap-4">
            {destinations.map((destination) => (
              <div key={destination.id} className="app-card-soft px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xl font-black text-[color:var(--app-text)]">{destination.name}</p>
                    <p className="mt-1 text-sm text-[color:var(--app-text-soft)]">{destination.vibe}</p>
                  </div>
                  <div className="app-pill px-3 py-1 text-sm font-semibold">
                    {destination.placeCount}
                  </div>
                </div>
                <div className={`mt-4 h-20 rounded-[22px] bg-gradient-to-br ${destination.coverTone}`} />
              </div>
            ))}
          </div>
          <Link href="/places" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--app-text)]">
            Open library
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
