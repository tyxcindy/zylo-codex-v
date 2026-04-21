"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bookmark, Check, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Destination, Place } from "@/lib/domain";

type SortMode = "most-saved" | "newest" | "az";

const categoryTabs = [
  { id: "all", label: "All" },
  { id: "restaurants", label: "Food" },
  { id: "cafes", label: "Cafes" },
  { id: "bars", label: "Bars" },
  { id: "activities", label: "Activities" },
  { id: "photo spots", label: "Photo spots" },
  { id: "hotels", label: "Stays" }
] as const;

function mapsUrl(address: string, lat: number, lng: number) {
  const query = Number.isFinite(lat) && Number.isFinite(lng) ? `${lat},${lng}` : address;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function DestinationDetail({
  destination,
  places
}: {
  destination: Destination;
  places: Place[];
}) {
  const [activeCategory, setActiveCategory] = useState<(typeof categoryTabs)[number]["id"]>("all");
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("most-saved");

  const filteredPlaces = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return places
      .filter((place) => {
        const matchesCategory = activeCategory === "all" || place.category === activeCategory;

        const haystack = [place.name, place.description, place.city, ...place.tags]
          .join(" ")
          .toLowerCase();
        const matchesQuery = !normalized || haystack.includes(normalized);

        return matchesCategory && matchesQuery;
      })
      .sort((left, right) => {
        if (sortMode === "az") {
          return left.name.localeCompare(right.name);
        }

        if (sortMode === "newest") {
          return right.id.localeCompare(left.id);
        }

        return right.timesSeen - left.timesSeen;
      });
  }, [activeCategory, places, query, sortMode]);

  return (
    <div className="space-y-6">
      <div className="app-card overflow-hidden p-0">
        <div className="relative h-[240px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: destination.imageUrl ? `url(${destination.imageUrl})` : undefined }}
          />
          <div className="app-image-overlay absolute inset-0" />
          <div className="absolute left-4 top-4">
            <Link
              href="/destinations"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/16 bg-[rgba(12,18,32,0.34)] text-white backdrop-blur-xl"
              aria-label="Back to destinations"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-6 text-white">
            <p className="text-sm uppercase tracking-[0.18em] text-white/60">{destination.country}</p>
            <h1 className="mt-2 text-5xl font-black">{destination.name}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/74">{destination.vibe}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div className="app-card px-6 py-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {categoryTabs.map((tab) => {
                  const count =
                    tab.id === "all" ? places.length : places.filter((place) => place.category === tab.id).length;
                  const active = activeCategory === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveCategory(tab.id)}
                      className={
                        active
                          ? "rounded-full border border-white/16 bg-[linear-gradient(135deg,var(--brand)_0%,color-mix(in_srgb,var(--brand)_72%,white)_100%)] px-4 py-2 text-sm font-semibold text-white shadow-[0_16px_28px_rgba(91,104,255,0.22)]"
                          : "rounded-full border border-[color:var(--line)] bg-[color:var(--glass-bg)] px-4 py-2 text-sm font-semibold text-[color:var(--app-text-soft)]"
                      }
                    >
                      {tab.label} ({count})
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={`Search ${destination.name} places`}
                  className="h-11 rounded-full border border-[color:var(--line)] bg-[color:var(--glass-bg)] px-4 text-sm text-[color:var(--app-text)] placeholder:text-[color:var(--app-text-soft)]"
                />
                <select
                  value={sortMode}
                  onChange={(event) => setSortMode(event.target.value as SortMode)}
                  className="h-11 rounded-full border border-[color:var(--line)] bg-[color:var(--glass-bg)] px-4 text-sm text-[color:var(--app-text)]"
                >
                  <option value="most-saved">Most saved</option>
                  <option value="newest">Newest</option>
                  <option value="az">A-Z</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {filteredPlaces.map((place) => (
              <div key={place.id} className="app-card overflow-hidden p-0">
                <div
                  className="h-[160px] bg-cover bg-center"
                  style={{ backgroundImage: place.imageUrl ? `url(${place.imageUrl})` : undefined }}
                />
                <div className="p-5 text-[color:var(--app-text)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold text-[color:var(--app-text)]">{place.name}</p>
                      <p className="mt-1 text-sm text-[color:var(--app-text-soft)]">{place.category}</p>
                    </div>
                    {place.timesSeen > 1 ? (
                      <span className="app-pill px-3 py-1 text-xs font-semibold">
                        Seen {place.timesSeen}x
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-4 text-sm leading-7 text-[color:var(--app-text-soft)]">{place.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {place.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="app-pill px-3 py-1 text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-[color:var(--line)] pt-4 text-sm">
                    <div className="flex items-center gap-3 text-[color:var(--app-text-soft)]">
                      <button type="button" aria-label="Toggle itinerary save">
                        <Bookmark className="h-4 w-4" />
                      </button>
                      <button type="button" aria-label="Toggle visited">
                        <Check className="h-4 w-4" />
                      </button>
                    </div>
                    <a
                      href={mapsUrl(place.address, place.coordinates.lat, place.coordinates.lng)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 font-semibold text-[color:var(--app-text)]"
                    >
                      <MapPin className="h-4 w-4" />
                      Maps
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredPlaces.length === 0 ? (
            <div className="app-card px-6 py-12 text-center text-[color:var(--app-text)]">
              <p className="text-xl font-bold text-[color:var(--app-text)]">No places match that filter yet.</p>
              <p className="mt-3 text-sm text-[color:var(--app-text-soft)]">Try another category, search term, or import a new reel link.</p>
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="app-card px-6 py-6 text-[color:var(--app-text)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--app-text-soft)]">Actions</p>
            <div className="mt-5 space-y-3">
              <Button asChild className="w-full justify-center">
                <Link href="/import">Import more places</Link>
              </Button>
              <Button
                asChild
                variant="secondary"
                className="w-full justify-center"
              >
                <Link href="/trips">Create itinerary</Link>
              </Button>
            </div>
          </div>
          <div className="app-card px-6 py-6 text-[color:var(--app-text)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--app-text-soft)]">Destination snapshot</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="app-card-soft px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--app-text-soft)]">Places</p>
                <p className="mt-2 text-2xl font-black text-[color:var(--app-text)]">{places.length}</p>
              </div>
              <div className="app-card-soft px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--app-text-soft)]">Top signals</p>
                <p className="mt-2 text-2xl font-black text-[color:var(--app-text)]">
                  {places.reduce((sum, place) => sum + place.timesSeen, 0)}
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {(destination.spotlightTags ?? []).map((tag) => (
                <span
                  key={tag}
                  className="app-pill px-3 py-1 text-xs font-semibold"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
