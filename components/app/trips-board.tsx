"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  GripVertical,
  MapPin,
  Minus,
  Plus,
  Sparkles,
  Trash2,
  Undo2
} from "lucide-react";
import { useEffect, useMemo, useState, type DragEvent } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { destinations as seedDestinations, places as seedPlaces } from "@/lib/data";
import type { Destination, Place } from "@/lib/domain";
import { useTripDraft } from "@/lib/use-trip-draft";

type TripsBoardProps = {
  initialPlannerNotes: string;
  destinations: Destination[];
  places: Place[];
  plannerOnly?: boolean;
  galleryOnly?: boolean;
  initialTripId?: string;
};

type StepperControlProps = {
  label: string;
  helper: string;
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  decreaseDisabled?: boolean;
  increaseDisabled?: boolean;
};

function mapsUrl(place: Place) {
  const query =
    Number.isFinite(place.coordinates.lat) && Number.isFinite(place.coordinates.lng)
      ? `${place.coordinates.lat},${place.coordinates.lng}`
      : place.address;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function buildDayMapHref(dayId: string, city?: string) {
  const params = new URLSearchParams({
    scope: "day",
    day: dayId
  });

  if (city) {
    params.set("city", city);
  }

  return `/map?${params.toString()}`;
}

function StepperControl({
  label,
  helper,
  value,
  onDecrease,
  onIncrease,
  decreaseDisabled,
  increaseDisabled
}: StepperControlProps) {
  return (
    <div className="app-card-soft rounded-[24px] border border-[color:var(--line)] px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--app-text-soft)]">{label}</p>
          <p className="mt-2 text-sm leading-6 text-[color:var(--app-text-soft)]">{helper}</p>
        </div>
        <p className="text-3xl font-semibold text-[color:var(--app-text)]">{value}</p>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-10 w-10 rounded-full px-0"
          onClick={onDecrease}
          disabled={decreaseDisabled}
          aria-label={`Decrease ${label.toLowerCase()}`}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="app"
          size="sm"
          className="h-10 flex-1 rounded-full"
          onClick={onIncrease}
          disabled={increaseDisabled}
          aria-label={`Increase ${label.toLowerCase()}`}
        >
          <Plus className="h-4 w-4" />
          Adjust
        </Button>
      </div>
    </div>
  );
}

export function TripsBoard({
  initialPlannerNotes: _initialPlannerNotes,
  destinations,
  places,
  plannerOnly = false,
  galleryOnly = false,
  initialTripId
}: TripsBoardProps) {
  const {
    tripState,
    activeTrip: trip,
    activeTripId,
    setActiveTrip,
    createTrip,
    deleteTrip,
    reorderPrimaryTripDay,
    assignPlaceToPrimaryTripDay,
    addPrimaryTripDay,
    removePrimaryTripDay,
    removePlaceFromPrimaryTrip,
    setPrimaryTripDayCount,
    setPrimaryTripTravelers,
    updateActiveTripDestination,
    updateActiveTripNotes,
    limits
  } = useTripDraft();
  const [activeDayId, setActiveDayId] = useState<string | null>(null);
  const [dropDayId, setDropDayId] = useState<string | null>(null);
  const [activePlaceId, setActivePlaceId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    if (initialTripId && initialTripId !== activeTripId) {
      setActiveTrip(initialTripId);
    }
  }, [activeTripId, initialTripId, setActiveTrip]);

  useEffect(() => {
    setSaveState("idle");
    setSaveMessage("");
  }, [trip?.id]);

  const mergedDestinations = useMemo(() => {
    const destinationMap = new Map<string, Destination>();

    for (const destination of seedDestinations) {
      destinationMap.set(destination.id, destination);
    }

    for (const destination of destinations) {
      destinationMap.set(destination.id, destination);
    }

    return Array.from(destinationMap.values());
  }, [destinations]);
  const mergedPlaces = useMemo(() => {
    const placeMap = new Map<string, Place>();

    for (const place of seedPlaces) {
      placeMap.set(place.id, place);
    }

    for (const place of places) {
      placeMap.set(place.id, place);
    }

    return Array.from(placeMap.values());
  }, [places]);
  const destinationById = useMemo(
    () => new Map(mergedDestinations.map((destination) => [destination.id, destination])),
    [mergedDestinations]
  );
  const placeCountByDestinationId = useMemo(() => {
    const counts = new Map<string, number>();

    for (const place of mergedPlaces) {
      counts.set(place.destinationId, (counts.get(place.destinationId) ?? 0) + 1);
    }

    return counts;
  }, [mergedPlaces]);
  const availableDestinations = useMemo(
    () =>
      mergedDestinations.filter((destination) => (placeCountByDestinationId.get(destination.id) ?? 0) > 0),
    [mergedDestinations, placeCountByDestinationId]
  );

  const tripDestination = trip ? destinationById.get(trip.destinationId) ?? null : null;

  if (!trip) {
    return null;
  }

  const tripPlaces = mergedPlaces.filter((place) => place.destinationId === trip.destinationId);
  const tripHasImportedPlaces = tripPlaces.length > 0;
  const plannedPlaceIds = new Set(trip.days.flatMap((day) => day.stops.map((stop) => stop.placeId)));
  const readyPlaces = tripPlaces.filter((place) => !plannedPlaceIds.has(place.id));
  const totalStops = trip.days.reduce((count, day) => count + day.stops.length, 0);
  const isSavedPlacesDropTarget = Boolean(activePlaceId && plannedPlaceIds.has(activePlaceId));
  const plannerNotes = trip.plannerNotes ?? "";
  const showGallery = !plannerOnly;
  const showPlanner = !galleryOnly;
  const defaultCreateDestination =
    (tripDestination && tripHasImportedPlaces ? tripDestination : null) ?? availableDestinations[0] ?? null;

  function handleDragStart(dayId: string) {
    setActivePlaceId(null);
    setActiveDayId(dayId);
    setDropDayId(dayId);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>, dayId: string) {
    event.preventDefault();
    if ((activeDayId && activeDayId !== dayId) || activePlaceId) {
      setDropDayId(dayId);
    }
  }

  function handleDrop(dayId: string) {
    if (activePlaceId) {
      const place = tripPlaces.find((item) => item.id === activePlaceId);

      if (place) {
        assignPlaceToPrimaryTripDay(place, dayId);
      }

      clearDragState();
      return;
    }

    if (!activeDayId) {
      return;
    }

    reorderPrimaryTripDay(activeDayId, dayId);
    clearDragState();
  }

  function clearDragState() {
    setActiveDayId(null);
    setActivePlaceId(null);
    setDropDayId(null);
  }

  function handlePlaceDragStart(placeId: string) {
    setActiveDayId(null);
    setActivePlaceId(placeId);
    setDropDayId(null);
  }

  function handleStopDragStart(event: DragEvent<HTMLDivElement>, placeId: string) {
    event.stopPropagation();
    handlePlaceDragStart(placeId);
  }

  function handleSavedPlacesDragOver(event: DragEvent<HTMLDivElement>) {
    if (!isSavedPlacesDropTarget) {
      return;
    }

    event.preventDefault();
    setDropDayId(null);
  }

  function handleSavedPlacesDrop() {
    if (activePlaceId && plannedPlaceIds.has(activePlaceId)) {
      removePlaceFromPrimaryTrip(activePlaceId);
    }

    clearDragState();
  }

  function handleSavePlannerNotes() {
    setSaveState("saved");
    setSaveMessage("Planner notes stay with this itinerary.");
  }

  return (
    <div className="space-y-6">
      {showGallery ? (
        <section className="app-card px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-4 border-b border-[color:var(--line)] pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--app-text-soft)]">
                Itinerary gallery
              </p>
              <h2 className="mt-3 text-4xl font-semibold leading-none text-[color:var(--app-text)] sm:text-[2.8rem]">
                Plan Multiple Trips
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--app-text-soft)]">
                Start from a gallery of itineraries, jump between them fast, and keep each trip’s
                days, travelers, and saved places independent.
              </p>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <Button
                type="button"
                variant="app"
                className="rounded-full px-5"
                onClick={() => {
                  if (defaultCreateDestination) {
                    createTrip(defaultCreateDestination);
                  }
                }}
                disabled={!defaultCreateDestination}
              >
                <Plus className="h-4 w-4" />
                New itinerary
              </Button>
              <p className="text-xs text-[color:var(--app-text-soft)]">
                New itineraries can only start from destinations with saved places.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {tripState.map((item) => {
              const destination = destinationById.get(item.destinationId) ?? null;
              const stopCount = item.days.reduce((count, day) => count + day.stops.length, 0);
              const hasImportedPlaces = (placeCountByDestinationId.get(item.destinationId) ?? 0) > 0;
              const isActive = !galleryOnly && item.id === activeTripId;

              return (
                <div
                  key={item.id}
                  role={galleryOnly ? undefined : "button"}
                  tabIndex={galleryOnly ? undefined : 0}
                  onClick={galleryOnly ? undefined : () => setActiveTrip(item.id)}
                  onKeyDown={
                    galleryOnly
                      ? undefined
                      : (event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setActiveTrip(item.id);
                          }
                        }
                  }
                  className={[
                    "group app-card-soft w-full overflow-hidden rounded-[28px] border text-left transition-all duration-200",
                    isActive
                      ? "border-[color:var(--brand)] shadow-[0_28px_60px_rgba(28,96,214,0.16)]"
                      : "border-[color:var(--line)]",
                    galleryOnly ? "" : "hover:border-[color:var(--brand)]/40"
                  ].join(" ")}
                >
                  <div className="grid gap-4 md:grid-cols-[260px_minmax(0,1fr)]">
                    <div className="relative min-h-[200px] overflow-hidden md:min-h-full">
                      {destination?.imageUrl ? (
                        <Image
                          src={destination.imageUrl}
                          alt={destination.name}
                          fill
                          className="object-cover transition duration-300 group-hover:scale-[1.02]"
                          sizes="260px"
                        />
                      ) : (
                        <div className="h-full w-full bg-[color:var(--glass-bg)]" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/18 to-transparent" />
                      <div className="absolute inset-x-4 bottom-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/72">
                          {destination?.country ?? "Trip draft"}
                        </p>
                        <p className="mt-2 text-3xl font-semibold text-white">{item.title}</p>
                      </div>
                    </div>

                    <div className="px-5 py-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--app-text-soft)]">
                            {destination?.name ?? "Unassigned destination"}
                          </p>
                          <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--app-text-soft)]">
                            {hasImportedPlaces
                              ? destination?.vibe ?? item.vibe
                              : "This itinerary needs imported saved places before the planner and map can be useful."}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Button type="button" variant="secondary" size="sm" className="rounded-full" asChild>
                            <Link
                              href={`/trips/${item.id}`}
                              onClick={(event) => event.stopPropagation()}
                            >
                              Open in planner
                            </Link>
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="rounded-full"
                            onClick={(event) => {
                              event.stopPropagation();
                              deleteTrip(item.id);
                            }}
                            aria-label={`Delete ${item.title}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          {!galleryOnly ? (
                            <div className="app-pill self-start px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em]">
                              {isActive ? "Active" : "Select"}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        {[
                          { label: "Trip days", value: String(item.days.length) },
                          { label: "Travelers", value: String(item.travelers) },
                          { label: "Saved stops", value: String(stopCount) }
                        ].map((stat) => (
                          <div key={stat.label} className="rounded-[20px] border border-[color:var(--line)] bg-[color:var(--glass-bg)] px-4 py-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--app-text-soft)]">
                              {stat.label}
                            </p>
                            <p className="mt-2 text-2xl font-semibold text-[color:var(--app-text)]">{stat.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {showPlanner ? (
      <div className="grid gap-4 xl:h-[calc(100dvh-11rem)] xl:grid-cols-[minmax(0,1.08fr)_360px]">
        <div className="app-card px-5 py-5 sm:px-6 sm:py-6 xl:min-h-0 xl:overflow-y-auto xl:pr-3">
          <div className="flex flex-col gap-4 border-b border-[color:var(--line)] pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              {plannerOnly ? (
                <Button type="button" variant="secondary" size="sm" className="rounded-full" asChild>
                  <Link href="/trips">
                    <ArrowLeft className="h-4 w-4" />
                    Back to itineraries
                  </Link>
                </Button>
              ) : null}
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--app-text-soft)]">
                Editable itinerary
              </p>
              <h2 className="mt-3 text-4xl font-semibold leading-none text-[color:var(--app-text)] sm:text-[2.8rem]">
                {trip.title}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--app-text-soft)]">
                Drag a day to reorder it, drag a place between days, or drag a planned stop back into
                saved places to unslot it without losing it.
              </p>
            </div>
            <div className="app-pill inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-[#8b84ff]" />
              Active itinerary
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {trip.days.map((day, index) => {
              const primaryStop = day.stops[0];
              const linkedPlace = primaryStop ? mergedPlaces.find((place) => place.id === primaryStop.placeId) : null;
              const dayPlaces = day.stops
                .map((stop) => mergedPlaces.find((place) => place.id === stop.placeId))
                .filter((place): place is Place => Boolean(place));
              const dayMapHref = dayPlaces.length > 0 ? buildDayMapHref(day.id, dayPlaces[0]?.city) : null;
              const isDragging = activeDayId === day.id;
              const isDropTarget =
                dropDayId === day.id && (activeDayId !== day.id || activePlaceId !== null);

              return (
                <div
                  key={day.id}
                  draggable
                  onDragStart={() => handleDragStart(day.id)}
                  onDragEnd={clearDragState}
                  onDragOver={(event) => handleDragOver(event, day.id)}
                  onDrop={() => handleDrop(day.id)}
                  className={[
                    "app-card-soft cursor-grab rounded-[28px] border px-4 py-4 transition-all duration-200 active:cursor-grabbing sm:px-5",
                    isDragging
                      ? "border-[color:var(--brand)] opacity-55 shadow-[0_24px_60px_rgba(91,104,255,0.12)]"
                      : isDropTarget
                        ? "border-[color:var(--brand)] bg-[color:var(--app-card-bg)] shadow-[0_0_0_1px_rgba(139,132,255,0.2),0_30px_60px_rgba(10,14,22,0.18)]"
                        : "border-[color:var(--line)]"
                  ].join(" ")}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[color:var(--line)] bg-[color:var(--glass-bg)] text-[color:var(--app-text-soft)]">
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--brand)]">
                          Day {index + 1}
                        </p>
                        <p className="mt-2 text-xl font-semibold text-[color:var(--app-text)] sm:text-[1.8rem]">
                          {day.title}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[color:var(--app-text-soft)]">
                          {primaryStop ? (
                            <>
                              <span className="inline-flex items-center gap-2">
                                <CalendarDays className="h-4 w-4" />
                                {primaryStop.time}
                              </span>
                              <span className="rounded-full bg-[color:var(--brand)]/12 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--brand)]">
                                {primaryStop.note}
                              </span>
                              {day.stops.length > 1 ? (
                                <span className="rounded-full border border-[color:var(--line)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-text-soft)]">
                                  +{day.stops.length - 1} more stop
                                </span>
                              ) : null}
                            </>
                          ) : (
                            <span className="text-sm text-[color:var(--app-text-soft)]">
                              Drop a saved place here to fill this day.
                            </span>
                          )}
                        </div>
                        {linkedPlace ? (
                          <p className="mt-3 text-sm leading-6 text-[color:var(--app-text-soft)]">
                            {linkedPlace.name} · {linkedPlace.address}
                          </p>
                        ) : null}
                        {day.stops.length > 0 ? (
                          <div className="mt-4 space-y-2">
                            {day.stops.map((stop) => {
                              const stopPlace = mergedPlaces.find((place) => place.id === stop.placeId);

                              return (
                                <div
                                  key={stop.id}
                                  draggable
                                  onDragStart={(event) => handleStopDragStart(event, stop.placeId)}
                                  onDragEnd={(event) => {
                                    event.stopPropagation();
                                    clearDragState();
                                  }}
                                  className="cursor-grab rounded-[18px] border border-[color:var(--line)] bg-[color:var(--glass-bg)] px-3 py-3 active:cursor-grabbing"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-3">
                                    <p className="text-sm font-semibold text-[color:var(--app-text)]">
                                      {stopPlace?.name ?? "Saved place"}
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs uppercase tracking-[0.16em] text-[color:var(--app-text-soft)]">
                                        {stop.time}
                                      </span>
                                      {stopPlace ? (
                                        <Button
                                          type="button"
                                          variant="secondary"
                                          size="sm"
                                          className="h-8 rounded-full px-3"
                                          asChild
                                        >
                                          <a
                                            href={mapsUrl(stopPlace)}
                                            target="_blank"
                                            rel="noreferrer"
                                            aria-label={`Open ${stopPlace.name} in Google Maps`}
                                          >
                                            <MapPin className="h-3.5 w-3.5" />
                                            Map
                                          </a>
                                        </Button>
                                      ) : null}
                                      <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        className="h-8 rounded-full px-3"
                                        onClick={() => removePlaceFromPrimaryTrip(stop.placeId)}
                                        aria-label={`Remove ${stopPlace?.name ?? "saved place"} from this day`}
                                      >
                                        <Undo2 className="h-3.5 w-3.5" />
                                        Remove
                                      </Button>
                                    </div>
                                  </div>
                                  <p className="mt-1 text-sm text-[color:var(--app-text-soft)]">
                                    {stopPlace?.address ?? stop.note}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2 self-end sm:self-start">
                      {isDropTarget ? (
                        <span className="rounded-full bg-[color:var(--brand)]/12 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--brand)]">
                          {activePlaceId ? `Drop place into Day ${index + 1}` : `Drop to make Day ${index + 1}`}
                        </span>
                      ) : null}
                      {dayMapHref ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="rounded-full"
                          asChild
                        >
                          <Link href={dayMapHref} aria-label={`Open Day ${index + 1} on the map workspace`}>
                            <MapPin className="h-4 w-4" />
                            Map
                          </Link>
                        </Button>
                      ) : (
                        <Button type="button" variant="secondary" size="sm" className="rounded-full" disabled>
                          <MapPin className="h-4 w-4" />
                          Map
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="rounded-full"
                        onClick={() => removePrimaryTripDay(day.id)}
                        disabled={trip.days.length <= limits.minTripDays}
                        aria-label={`Delete Day ${index + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              onClick={addPrimaryTripDay}
              disabled={trip.days.length >= limits.maxTripDays}
              className="flex w-full items-center justify-center rounded-[28px] border border-dashed border-[color:var(--line)] bg-[color:var(--glass-bg)] px-5 py-5 text-base font-semibold text-[color:var(--app-text-soft)] transition-colors hover:text-[color:var(--app-text)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              + Add New Activity
            </button>
          </div>
        </div>

        <div className="space-y-4 xl:min-h-0 xl:overflow-y-auto xl:pr-2">
          <div className="app-card overflow-hidden p-0">
            {tripDestination?.imageUrl ? (
              <div className="relative h-44 w-full">
                <Image
                  src={tripDestination.imageUrl}
                  alt={tripDestination.name}
                  fill
                  className="object-cover"
                  sizes="360px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/12 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
                    Current itinerary
                  </p>
                  <h3 className="mt-2 text-3xl text-white">{trip.title}</h3>
                </div>
              </div>
            ) : null}
            <div className="px-5 py-5">
              <p className="text-sm leading-7 text-[color:var(--app-text-soft)]">
                {tripDestination?.vibe ??
                  "A saved-place trip should feel easy to edit while the route is still taking shape."}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  { label: "Destination", value: tripDestination?.name ?? "Unset" },
                  { label: "Trip days", value: String(trip.days.length) },
                  { label: "Travelers", value: String(trip.travelers) },
                  { label: "Saved stops", value: String(totalStops) }
                ].map((item) => (
                  <div key={item.label} className="app-card-soft px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--app-text-soft)]">
                      {item.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[color:var(--app-text)]">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="app-card px-5 py-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--app-text-soft)]">
                  Trip setup
                </p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--app-text-soft)]">
                  Each itinerary keeps its own destination, duration, and traveler count.
                </p>
              </div>
              <div className="app-pill px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em]">
                Live edits
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              <label className="app-card-soft rounded-[24px] border border-[color:var(--line)] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--app-text-soft)]">
                  Destination
                </p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--app-text-soft)]">
                  Only destinations with imported saved places can be assigned here. Switching
                  destination resets the saved-place slots for this itinerary.
                </p>
                <select
                  value={trip.destinationId}
                  onChange={(event) => {
                    const nextDestination = destinationById.get(event.target.value);

                    if (nextDestination) {
                      updateActiveTripDestination(nextDestination);
                    }
                  }}
                  className="mt-4 h-11 w-full rounded-[18px] border border-[color:var(--line)] bg-[color:var(--glass-bg)] px-4 text-[color:var(--app-text)]"
                >
                  {!tripHasImportedPlaces && tripDestination ? (
                    <option value={trip.destinationId} disabled>
                      {tripDestination.name}, {tripDestination.country} requires saved places first
                    </option>
                  ) : null}
                  {availableDestinations.map((destination) => (
                    <option key={destination.id} value={destination.id}>
                      {destination.name}, {destination.country}
                    </option>
                  ))}
                </select>
              </label>

              <StepperControl
                label="Trip days"
                helper="Add or trim days. Places removed with a deleted day go back into saved places."
                value={trip.days.length}
                onDecrease={() => setPrimaryTripDayCount(trip.days.length - 1)}
                onIncrease={() => setPrimaryTripDayCount(trip.days.length + 1)}
                decreaseDisabled={trip.days.length <= limits.minTripDays}
                increaseDisabled={trip.days.length >= limits.maxTripDays}
              />

              <StepperControl
                label="Travelers"
                helper="Keep the trip headcount accurate while you iterate on the plan."
                value={trip.travelers}
                onDecrease={() => setPrimaryTripTravelers(trip.travelers - 1)}
                onIncrease={() => setPrimaryTripTravelers(trip.travelers + 1)}
                decreaseDisabled={trip.travelers <= limits.minTravelers}
                increaseDisabled={trip.travelers >= limits.maxTravelers}
              />
            </div>
          </div>

          <div
            className={[
              "app-card px-5 py-5 transition-all duration-200",
              isSavedPlacesDropTarget
                ? "border-[color:var(--brand)] bg-[color:var(--app-card-bg)] shadow-[0_0_0_1px_rgba(139,132,255,0.2),0_30px_60px_rgba(10,14,22,0.18)]"
                : ""
            ].join(" ")}
            data-testid="saved-places-dropzone"
            onDragOver={handleSavedPlacesDragOver}
            onDrop={handleSavedPlacesDrop}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--app-text-soft)]">
                  Saved places ready to slot in
                </p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--app-text-soft)]">
                  Drag one of these onto a day card, or drag a planned stop back here to remove it
                  from the itinerary.
                </p>
              </div>
              <div className="app-pill px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em]">
                {readyPlaces.length} left
              </div>
            </div>
            {isSavedPlacesDropTarget ? (
              <div className="mt-4 rounded-[22px] border border-dashed border-[color:var(--brand)] bg-[color:var(--brand)]/8 px-4 py-4 text-sm font-semibold text-[color:var(--brand)]">
                Drop here to unslot this place and send it back to your saved list.
              </div>
            ) : null}
            <div className="mt-4 space-y-3">
              {!tripHasImportedPlaces ? (
                <div className="app-card-soft rounded-[22px] px-4 py-4 text-sm leading-7 text-[color:var(--app-text-soft)]">
                  Import saved places for this destination first, or switch this itinerary to a
                  destination that already has places in your library.
                </div>
              ) : readyPlaces.length > 0 ? (
                readyPlaces.map((place) => (
                  <div
                    key={place.id}
                    draggable
                    onDragStart={() => handlePlaceDragStart(place.id)}
                    onDragEnd={clearDragState}
                    className={[
                      "app-card-soft cursor-grab rounded-[22px] border px-4 py-4 transition-all duration-200 active:cursor-grabbing",
                      activePlaceId === place.id
                        ? "border-[color:var(--brand)] opacity-60"
                        : "border-[color:var(--line)]"
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[color:var(--app-text)]">{place.name}</p>
                        <p className="mt-1 text-sm text-[color:var(--app-text-soft)]">
                          {place.address || `${place.city}, ${place.country}`}
                        </p>
                      </div>
                      <div className="rounded-full bg-[color:var(--brand)]/12 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--brand)]">
                        {place.category.replace(" ", "-")}
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button type="button" variant="secondary" size="sm" className="rounded-full" asChild>
                        <a
                          href={mapsUrl(place)}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Open ${place.name} in Google Maps`}
                        >
                          <MapPin className="h-4 w-4" />
                          Map
                        </a>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="app-card-soft rounded-[22px] px-4 py-4 text-sm leading-7 text-[color:var(--app-text-soft)]">
                  Everything for this destination is already placed into this itinerary. Add another
                  day or drag a stop back here if you want to reshuffle the plan.
                </div>
              )}
            </div>
          </div>

          <div className="app-card px-5 py-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--app-text-soft)]">
                  Planner notes
                </p>
                <p className="mt-3 text-sm leading-7 text-[color:var(--app-text-soft)]">
                  Keep route notes, booking reminders, or anything you want to remember while the
                  trip is still loose.
                </p>
              </div>
              <span className="app-pill px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
                Saved per itinerary
              </span>
            </div>

            <div className="mt-5 space-y-4">
              <Textarea
                value={plannerNotes}
                onChange={(event) => {
                  updateActiveTripNotes(event.target.value);
                  if (saveState !== "idle") {
                    setSaveState("idle");
                    setSaveMessage("");
                  }
                }}
                placeholder="Add anything here: neighborhoods to prioritize, timing constraints, food notes, booking reminders, or route ideas."
                className="min-h-[220px] bg-[color:var(--glass-bg)] text-[color:var(--app-text)] placeholder:text-[color:var(--app-text-soft)]"
              />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--app-text-soft)]">
                  {plannerNotes.length}/4000 characters
                </p>
                <div className="flex items-center gap-3">
                  {saveMessage ? (
                    <p className="text-sm text-[color:var(--brand-3)]">
                      {saveMessage}
                    </p>
                  ) : null}
                  <Button
                    type="button"
                    variant="app"
                    className="rounded-[18px] px-5"
                    onClick={handleSavePlannerNotes}
                  >
                    Save notes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      ) : null}
    </div>
  );
}
