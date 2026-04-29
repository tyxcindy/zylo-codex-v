import { ArrowUpRight, Clock3, Sparkles } from "lucide-react";
import Link from "next/link";

import { DestinationCarousel } from "@/components/ui/destination-carousel";

import type { Destination, Place, SourceArtifact, Trip } from "@/lib/domain";

const dashboardCarouselItems = [
  {
    id: "amalfi",
    imageUrl:
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80",
    title: "Amalfi Coast",
    subtitle: "Cliffside swims, lemon terraces, late golden light."
  },
  {
    id: "banff",
    imageUrl:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    title: "Banff",
    subtitle: "Cold blue lakes, sharp peaks, alpine texture."
  },
  {
    id: "kyoto",
    imageUrl:
      "https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?auto=format&fit=crop&w=1200&q=80",
    title: "Kyoto",
    subtitle: "Lantern alleys, cedar paths, quiet tea stops."
  },
  {
    id: "amalfi-2",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    title: "Seoul",
    subtitle: "Design stops, late bites, and dense city texture."
  }
] as const;

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
      <DestinationCarousel
        items={dashboardCarouselItems}
        title="Spots worth a future save"
        subtitle="A tighter travel strip that lives on its own row."
      />

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
            <p className="mt-3 text-[2.4rem] font-semibold leading-none text-[color:var(--app-text)]">{stat.value}</p>
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
              .slice(0, 5)
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
                    <p className="text-2xl font-semibold text-[color:var(--app-text)]">{place.timesSeen}x</p>
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
            {destinations.slice(0, 2).map((destination) => (
              <div key={destination.id} className="app-card-soft px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xl font-semibold text-[color:var(--app-text)]">{destination.name}</p>
                    <p className="mt-1 text-sm text-[color:var(--app-text-soft)]">{destination.vibe}</p>
                  </div>
                  <div className="app-pill px-3 py-1 text-sm font-semibold">
                    {destination.placeCount}
                  </div>
                </div>
                <div
                  className={`mt-4 h-24 rounded-[22px] bg-gradient-to-br ${destination.coverTone}`}
                />
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
