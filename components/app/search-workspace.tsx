"use client";

import { useMemo, useState } from "react";
import { Search, Sparkles } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Destination, Place } from "@/lib/domain";

const categoryOptions = [
  "all",
  "restaurants",
  "cafes",
  "bars",
  "hotels",
  "activities",
  "scenic spots",
  "photo spots"
] as const;

export function SearchWorkspace({
  places,
  destinations
}: {
  places: Place[];
  destinations: Destination[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categoryOptions)[number]>("all");

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return places.filter((place) => {
      const matchesCategory = category === "all" || place.category === category;
      const haystack = [
        place.name,
        place.city,
        place.country,
        place.category,
        place.description,
        ...place.tags
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery = !normalized || haystack.includes(normalized);
      return matchesCategory && matchesQuery;
    });
  }, [category, places, query]);

  return (
    <div className="space-y-6">
      <Card className="app-card px-6 py-6 text-[color:var(--app-text)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--app-text-soft)]">Search</p>
            <h2 className="mt-3 text-3xl font-semibold text-[color:var(--app-text)]">Find anything you already saved.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--app-text-soft)]">
              Search by place name, city, category, or tags. This is the fastest way to pull saved
              spots back out of the pile before building a trip.
            </p>
          </div>
          <div className="rounded-[24px] border border-[color:var(--line)] bg-[color:var(--glass-bg)] px-4 py-3 text-sm text-[color:var(--app-text-soft)] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]">
            {results.length.toString().padStart(2, "0")} results
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--app-text-soft)]" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search Paris cafes, Tokyo ramen, hidden gems..."
              className="border-[color:var(--line)] bg-[color:var(--glass-bg)] pl-11 text-[color:var(--app-text)] placeholder:text-[color:var(--app-text-soft)]"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categoryOptions.map((option) => {
              const active = category === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setCategory(option)}
                  className={
                    active
                      ? "rounded-full border border-transparent bg-[color:var(--brand)] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_22px_rgba(91,104,255,0.22)]"
                      : "rounded-full border border-[color:var(--line)] bg-[color:var(--glass-bg)] px-4 py-2 text-sm font-semibold text-[color:var(--app-text-soft)]"
                  }
                >
                  {option === "all" ? "All" : option}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          {results.map((place) => {
            const destination = destinations.find((item) => item.id === place.destinationId);

            return (
              <Card key={place.id} className="app-card-soft px-5 py-5 text-[color:var(--app-text)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xl font-semibold text-[color:var(--app-text)]">{place.name}</p>
                    <p className="mt-1 text-sm text-[color:var(--app-text-soft)]">
                      {place.city}, {place.country} · {place.category}
                    </p>
                  </div>
                  <div className="app-pill px-3 py-1 text-xs uppercase tracking-[0.18em]">
                    {place.timesSeen}x saved
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-[color:var(--app-text-soft)]">{place.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {place.tags.map((tag) => (
                    <span
                      key={tag}
                      className="app-pill px-3 py-1 text-xs font-semibold"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-4 text-sm text-[color:var(--app-text-soft)]">
                  Destination: {destination?.name ?? place.city}
                </div>
              </Card>
            );
          })}

          {results.length === 0 ? (
            <Card className="app-card-soft px-6 py-10 text-center text-[color:var(--app-text)]">
              <p className="text-xl font-semibold text-[color:var(--app-text)]">No saved place matches that yet.</p>
              <p className="mt-3 text-sm text-[color:var(--app-text-soft)]">
                Try another city, a category, or import a new reel link first.
              </p>
            </Card>
          ) : null}
        </div>

        <Card className="app-card px-6 py-6 text-[color:var(--app-text)]">
          <div className="flex items-center gap-3 text-sm text-[color:var(--app-text-soft)]">
            <Sparkles className="h-4 w-4" />
            Search tips
          </div>
          <div className="mt-6 space-y-4 text-sm leading-7 text-[color:var(--app-text-soft)]">
            <p>Search by city names like `Tokyo`, `Paris`, or `Bali`.</p>
            <p>Search by vibe keywords like `coffee`, `market`, `sunset`, or `art`.</p>
            <p>Filter by category if you only want restaurants, cafes, hotels, or photo spots.</p>
            <p>Use Import when something new is still stuck inside a reel or screenshot.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
