"use client";

import Link from "next/link";
import { ArrowUpRight, MapPinned, Route, Sparkles } from "lucide-react";
import { useMemo, useState, type DragEvent } from "react";

import type { Destination, Place } from "@/lib/domain";
import { useTripDraft } from "@/lib/use-trip-draft";

type MapPanelProps = {
  destinations: Destination[];
  places: Place[];
  homeCity: string;
};

type CityCluster = {
  city: string;
  country: string;
  count: number;
  saveSignals: number;
  lat: number;
  lng: number;
  names: string[];
};

function projectCoordinates(lat: number, lng: number) {
  const left = 8 + ((lng + 180) / 360) * 84;
  const top = 14 + ((90 - lat) / 180) * 58;

  return {
    left: `${left}%`,
    top: `${top}%`
  };
}

export function MapPanel({ destinations, places, homeCity }: MapPanelProps) {
  const { primaryTrip: selectedTrip, assignPlaceToPrimaryTripDay } = useTripDraft();
  const [activePlaceId, setActivePlaceId] = useState<string | null>(null);
  const [dropDayId, setDropDayId] = useState<string | null>(null);

  const cityClusters = useMemo(
    () =>
      Object.values(
        places.reduce<Record<string, CityCluster>>((clusters, place) => {
          const existing = clusters[place.city];

          if (existing) {
            existing.count += 1;
            existing.saveSignals += place.timesSeen;
            existing.lat += place.coordinates.lat;
            existing.lng += place.coordinates.lng;
            existing.names.push(place.name);
            return clusters;
          }

          clusters[place.city] = {
            city: place.city,
            country: place.country,
            count: 1,
            saveSignals: place.timesSeen,
            lat: place.coordinates.lat,
            lng: place.coordinates.lng,
            names: [place.name]
          };

          return clusters;
        }, {})
      )
        .map((cluster) => ({
          ...cluster,
          lat: cluster.lat / cluster.count,
          lng: cluster.lng / cluster.count
        }))
        .sort((left, right) => right.saveSignals - left.saveSignals),
    [places]
  );

  if (!selectedTrip) {
    return null;
  }

  const selectedDestination =
    destinations.find((destination) => destination.id === selectedTrip.destinationId) ?? destinations[0] ?? null;

  if (!selectedDestination) {
    return null;
  }

  const selectedPlaces = places.filter((place) => place.destinationId === selectedDestination.id);
  const selectedTags = selectedDestination.spotlightTags ?? [];
  const highlightedCluster =
    cityClusters.find((cluster) => cluster.city === selectedDestination.name) ?? cityClusters[0] ?? null;
  const plannedPlaceIds = new Set(selectedTrip.days.flatMap((day) => day.stops.map((stop) => stop.placeId)));
  const readyPlaces = selectedPlaces.filter((place) => !plannedPlaceIds.has(place.id));

  function clearPlaceDrag() {
    setActivePlaceId(null);
    setDropDayId(null);
  }

  function handlePlaceDragStart(placeId: string) {
    setActivePlaceId(placeId);
  }

  function handleDayDragOver(event: DragEvent<HTMLDivElement>, dayId: string) {
    event.preventDefault();
    if (activePlaceId) {
      setDropDayId(dayId);
    }
  }

  function handleDayDrop(dayId: string) {
    if (!activePlaceId) {
      return;
    }

    const place = places.find((item) => item.id === activePlaceId);

    if (place) {
      assignPlaceToPrimaryTripDay(place, dayId);
    }

    clearPlaceDrag();
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.38fr)_360px]">
        <div className="app-card overflow-hidden px-6 py-6 sm:px-7">
          <div className="flex flex-col gap-4 border-b border-[color:var(--line)] pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--app-text-soft)]">
                Exploration map
              </p>
              <h2 className="mt-3 text-3xl leading-tight text-[color:var(--app-text)] sm:text-[2.3rem]">
                {places.length} places extracted globally.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--app-text-soft)]">
                Your saves are grouped by city, then pulled into a trip draft that you can keep editing
                while the map is still open.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-200">
                Travel only
              </div>
              <div className="app-pill px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em]">
                Home base: {homeCity}
              </div>
            </div>
          </div>

          <div className="relative mt-6 overflow-hidden rounded-[30px] border border-white/8 bg-[#0b1222] p-4 sm:p-5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_24%,rgba(103,109,255,0.22),transparent_18%),radial-gradient(circle_at_74%_22%,rgba(255,132,97,0.18),transparent_18%),radial-gradient(circle_at_56%_78%,rgba(83,213,177,0.16),transparent_20%),linear-gradient(180deg,rgba(7,10,18,0.9),rgba(8,12,21,0.98))]" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:72px_72px]" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
            <div className="pointer-events-none absolute inset-x-10 top-[18%] h-[20%] rounded-[999px] bg-white/6 blur-[80px]" />

            <div className="relative min-h-[460px]">
              <div className="absolute left-4 top-4 max-w-[250px] rounded-[24px] border border-white/10 bg-[#10192f]/88 px-4 py-4 shadow-[0_24px_54px_rgba(0,0,0,0.34)] backdrop-blur">
                <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
                  <Sparkles className="h-4 w-4 text-[#8a92ff]" />
                  Active route city
                </div>
                <p className="mt-3 text-xl font-semibold text-white">
                  {selectedDestination.name}, {selectedDestination.country}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/62">{selectedDestination.vibe}</p>
              </div>

              <div className="absolute bottom-4 left-4 right-4 rounded-[26px] border border-white/10 bg-[#10192f]/84 px-4 py-4 backdrop-blur">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/44">
                      City signal
                    </p>
                    <p className="mt-2 text-xl font-semibold text-white">
                      {highlightedCluster
                        ? `${highlightedCluster.city}, ${highlightedCluster.country}`
                        : `${selectedDestination.name}, ${selectedDestination.country}`}
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {[
                      `${selectedPlaces.length} extracted spots`,
                      `${selectedTrip.days.length} live trip days`,
                      `${readyPlaces.length} places still unslotted`
                    ].map((item) => (
                      <div
                        key={item}
                        className="rounded-full border border-white/10 bg-white/6 px-3 py-2 text-center text-xs font-medium text-white/72"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {cityClusters.map((cluster, index) => {
                const position = projectCoordinates(cluster.lat, cluster.lng);
                const isSelected = cluster.city === selectedDestination.name;

                return (
                  <div
                    key={`${cluster.city}-${cluster.country}`}
                    className="absolute"
                    style={{
                      left: position.left,
                      top: position.top,
                      transform: "translate(-50%, -50%)"
                    }}
                  >
                    <div
                      className={[
                        "pulse-dot relative flex items-center justify-center rounded-full border transition-transform duration-300",
                        isSelected
                          ? "h-5 w-5 border-[#9aa3ff] bg-[#8f96ff] text-[#8f96ff] shadow-[0_0_0_10px_rgba(143,150,255,0.12)]"
                          : "h-4 w-4 border-emerald-300/80 bg-emerald-300 text-emerald-300 shadow-[0_0_0_8px_rgba(110,231,183,0.12)]"
                      ].join(" ")}
                      style={{ animationDelay: `${index * 0.4}s` }}
                    />
                    <div
                      className={[
                        "absolute left-1/2 top-full mt-3 -translate-x-1/2 rounded-full border px-3 py-2 text-xs font-semibold text-white shadow-[0_18px_40px_rgba(0,0,0,0.3)] backdrop-blur",
                        isSelected ? "border-[#8a92ff]/40 bg-[#111a36]/92" : "border-white/10 bg-[#0f182d]/84"
                      ].join(" ")}
                    >
                      <span className="whitespace-nowrap">
                        {cluster.city} · {cluster.count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="app-card px-5 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--app-text-soft)]">
                  Selected city
                </p>
                <h3 className="mt-2 text-3xl text-[color:var(--app-text)]">{selectedDestination.name}</h3>
                <p className="mt-2 text-sm leading-7 text-[color:var(--app-text-soft)]">{selectedDestination.vibe}</p>
              </div>
              <div className={`h-16 w-16 rounded-[20px] bg-gradient-to-br ${selectedDestination.coverTone}`} />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                { label: "Saved spots", value: selectedDestination.placeCount.toString() },
                { label: "In draft", value: String(selectedTrip.days.flatMap((day) => day.stops).length) },
                { label: "Signal tags", value: selectedTags.length.toString() },
                { label: "Open slots", value: readyPlaces.length.toString() }
              ].map((stat) => (
                <div key={stat.label} className="app-card-soft px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--app-text-soft)]">{stat.label}</p>
                  <p className="mt-2 text-2xl font-black text-[color:var(--app-text)]">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {selectedTags.map((tag) => (
                <span key={tag} className="app-pill px-3 py-2 text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="app-card px-5 py-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--app-text)]">
              <MapPinned className="h-4 w-4 text-emerald-400" />
              Reel finds ready to drag
            </div>
            <div className="mt-4 space-y-3">
              {readyPlaces.length > 0 ? (
                readyPlaces.slice(0, 6).map((place) => (
                  <div
                    key={place.id}
                    draggable
                    onDragStart={() => handlePlaceDragStart(place.id)}
                    onDragEnd={clearPlaceDrag}
                    className={[
                      "app-card-soft cursor-grab rounded-[22px] border px-4 py-4 transition-all duration-200 active:cursor-grabbing",
                      activePlaceId === place.id ? "border-[color:var(--brand)] opacity-60" : "border-[color:var(--line)]"
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[color:var(--app-text)]">{place.name}</p>
                        <p className="mt-1 text-sm text-[color:var(--app-text-soft)]">
                          {place.address || `${place.city}, ${place.country}`}
                        </p>
                      </div>
                      <span className="rounded-full bg-[color:var(--brand)]/12 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--brand)]">
                        {place.category.replace(" ", "-")}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="app-card-soft rounded-[22px] px-4 py-4 text-sm leading-7 text-[color:var(--app-text-soft)]">
                  Every extracted place for this destination is already on the trip. Open the full itinerary if you want to reorder the days.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="app-card px-6 py-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--app-text)]">
            <Sparkles className="h-4 w-4 text-[#8a92ff]" />
            City clusters
          </div>
          <div className="mt-5 space-y-3">
            {cityClusters.slice(0, 5).map((cluster, index) => (
              <div key={`${cluster.city}-${cluster.country}`} className="app-card-soft flex items-center justify-between gap-4 px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--line)] bg-[color:var(--glass-bg)] text-sm font-black text-[color:var(--app-text)]">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <p className="font-semibold text-[color:var(--app-text)]">
                      {cluster.city}, {cluster.country}
                    </p>
                    <p className="mt-1 text-sm text-[color:var(--app-text-soft)]">
                      {cluster.names.slice(0, 2).join(" · ")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-[color:var(--app-text)]">{cluster.saveSignals}</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--app-text-soft)]">signals</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="app-card px-6 py-6">
          <div className="flex flex-col gap-4 border-b border-[color:var(--line)] pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--app-text)]">
                <Route className="h-4 w-4 text-orange-300" />
                Drop reel finds straight into a day
              </div>
              <h3 className="mt-3 text-2xl text-[color:var(--app-text)]">{selectedTrip.title}</h3>
              <p className="mt-2 text-sm leading-7 text-[color:var(--app-text-soft)]">
                This is the real workflow: pull a place out of the reel pile and slot it into the trip while the map is still doing context.
              </p>
            </div>
            <div className="app-pill px-4 py-2 text-sm font-semibold">{selectedTrip.dateRange}</div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {selectedTrip.days.map((day, index) => (
              <div
                key={day.id}
                onDragOver={(event) => handleDayDragOver(event, day.id)}
                onDrop={() => handleDayDrop(day.id)}
                className={[
                  "app-card-soft rounded-[24px] border px-4 py-4 transition-all duration-200",
                  dropDayId === day.id && activePlaceId
                    ? "border-[color:var(--brand)] bg-[color:var(--app-card-bg)] shadow-[0_0_0_1px_rgba(139,132,255,0.2)]"
                    : "border-[color:var(--line)]"
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-[color:var(--app-text)]">Day {index + 1}</p>
                  {dropDayId === day.id && activePlaceId ? (
                    <span className="rounded-full bg-[color:var(--brand)]/12 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--brand)]">
                      Drop here
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm font-medium text-[color:var(--app-text)]">{day.title}</p>
                <div className="mt-4 space-y-3">
                  {day.stops.length > 0 ? (
                    day.stops.map((stop) => {
                      const place = places.find((item) => item.id === stop.placeId);

                      return (
                        <div key={stop.id} className="rounded-[20px] border border-[color:var(--line)] bg-[color:var(--glass-bg)] px-3 py-3">
                          <p className="text-sm font-semibold text-[color:var(--app-text)]">
                            {place?.name ?? "Pinned place"}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[color:var(--app-text-soft)]">
                            {stop.time} · {stop.note}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-[20px] border border-dashed border-[color:var(--line)] bg-[color:var(--glass-bg)] px-3 py-5 text-center text-sm text-[color:var(--app-text-soft)]">
                      Drop a saved place here.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/trips"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--app-text)]"
          >
            Open full itinerary
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
