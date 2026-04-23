"use client";

import Image from "next/image";
import { CalendarDays, GripVertical, MapPin, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState, type DragEvent } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/client/api";
import { savePlannerNotesRequest } from "@/lib/client/planner-notes";
import type { Place } from "@/lib/domain";
import { destinations, places } from "@/lib/data";
import { useTripDraft } from "@/lib/use-trip-draft";

type TripsBoardProps = {
  initialPlannerNotes: string;
};

export function TripsBoard({ initialPlannerNotes }: TripsBoardProps) {
  const { primaryTrip: trip, reorderPrimaryTripDay, assignPlaceToPrimaryTripDay } = useTripDraft();
  const [activeDayId, setActiveDayId] = useState<string | null>(null);
  const [dropDayId, setDropDayId] = useState<string | null>(null);
  const [activePlaceId, setActivePlaceId] = useState<string | null>(null);
  const [plannerNotes, setPlannerNotes] = useState(initialPlannerNotes);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    setPlannerNotes(initialPlannerNotes);
  }, [initialPlannerNotes]);

  const tripDestination = useMemo(() => {
    if (!trip) {
      return null;
    }

    return destinations.find((item) => item.id === trip.destinationId) ?? null;
  }, [trip]);

  if (!trip) {
    return null;
  }

  const totalStops = trip.days.reduce((count, day) => count + day.stops.length, 0);
  const filledDays = trip.days.filter((day) => day.stops.length > 0).length;
  const plannedPlaceIds = new Set(trip.days.flatMap((day) => day.stops.map((stop) => stop.placeId)));
  const readyPlaces = places.filter(
    (place) => place.destinationId === trip.destinationId && !plannedPlaceIds.has(place.id)
  );

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
      const place = places.find((item) => item.id === activePlaceId);

      if (place) {
        assignPlaceToPrimaryTripDay(place, dayId);
      }

      setActivePlaceId(null);
      setActiveDayId(null);
      setDropDayId(null);
      return;
    }

    if (!activeDayId) {
      return;
    }

    reorderPrimaryTripDay(activeDayId, dayId);
    setActiveDayId(null);
    setDropDayId(null);
  }

  function clearDragState() {
    setActiveDayId(null);
    setActivePlaceId(null);
    setDropDayId(null);
  }

  function handlePlaceDragStart(placeId: string) {
    setActiveDayId(null);
    setActivePlaceId(placeId);
  }

  async function handleSavePlannerNotes() {
    setSaveState("saving");
    setSaveMessage("");

    try {
      await savePlannerNotesRequest({ notes: plannerNotes });

      setSaveState("saved");
      setSaveMessage("Planner notes saved.");
    } catch (error) {
      setSaveState("error");
      setSaveMessage(getApiErrorMessage(error, "Could not save planner notes."));
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_360px]">
      <div className="app-card px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-4 border-b border-[color:var(--line)] pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--app-text-soft)]">
              Editable itinerary
            </p>
            <h2 className="mt-3 text-4xl leading-none text-[color:var(--app-text)] sm:text-[2.8rem]">
              Itinerary Draft
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--app-text-soft)]">
              Drag any day card to a new position. Zylo renumbers the plan automatically, so moving
              a stop higher or lower is the same as changing which day it happens on.
            </p>
          </div>
          <div className="app-pill inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-[#8b84ff]" />
            Auto-magic plan
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {trip.days.map((day, index) => {
            const primaryStop = day.stops[0];
            const linkedPlace = primaryStop ? places.find((place) => place.id === primaryStop.placeId) : null;
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
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[color:var(--line)] bg-[color:var(--glass-bg)] text-[color:var(--app-text-soft)]">
                      <GripVertical className="h-4 w-4" />
                    </div>
                    <div className="flex h-14 w-16 shrink-0 items-center justify-center rounded-[20px] border border-[color:var(--line)] bg-[color:var(--background)] text-xl font-black text-[color:var(--brand)] shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_14px_30px_rgba(91,104,255,0.08)]">
                      Day {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xl font-black text-[color:var(--app-text)] sm:text-[1.8rem]">
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
                            const stopPlace = places.find((place) => place.id === stop.placeId);

                            return (
                              <div
                                key={stop.id}
                                className="rounded-[18px] border border-[color:var(--line)] bg-[color:var(--glass-bg)] px-3 py-3"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <p className="text-sm font-semibold text-[color:var(--app-text)]">
                                    {stopPlace?.name ?? "Saved place"}
                                  </p>
                                  <span className="text-xs uppercase tracking-[0.16em] text-[color:var(--app-text-soft)]">
                                    {stop.time}
                                  </span>
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

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    {isDropTarget ? (
                      <span className="rounded-full bg-[color:var(--brand)]/12 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--brand)]">
                        {activePlaceId ? `Drop place into Day ${index + 1}` : `Drop to make Day ${index + 1}`}
                      </span>
                    ) : null}
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[color:var(--line)] bg-[color:var(--glass-bg)] text-[color:var(--app-text-soft)]">
                      <MapPin className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <button
            type="button"
            className="flex w-full items-center justify-center rounded-[28px] border border-dashed border-[color:var(--line)] bg-[color:var(--glass-bg)] px-5 py-5 text-base font-semibold text-[color:var(--app-text-soft)] transition-colors hover:text-[color:var(--app-text)]"
          >
            + Add New Activity
          </button>
        </div>
      </div>

        <div className="space-y-4">
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
                  Current trip
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
                { label: "Trip days", value: String(trip.days.length) },
                { label: "Filled days", value: String(filledDays) },
                { label: "Planned stops", value: String(totalStops) },
                { label: "Travelers", value: String(trip.travelers) }
              ].map((item) => (
                <div key={item.label} className="app-card-soft px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--app-text-soft)]">
                    {item.label}
                  </p>
                  <p className="mt-2 text-2xl font-black text-[color:var(--app-text)]">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="app-card px-5 py-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--app-text-soft)]">
                Saved places ready to slot in
              </p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--app-text-soft)]">
                Drag one of these directly onto a day card instead of rebuilding the itinerary by hand.
              </p>
            </div>
            <div className="app-pill px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em]">
              {readyPlaces.length} left
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {readyPlaces.length > 0 ? (
              readyPlaces.slice(0, 5).map((place) => (
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
                </div>
              ))
            ) : (
              <div className="app-card-soft rounded-[22px] px-4 py-4 text-sm leading-7 text-[color:var(--app-text-soft)]">
                Everything for this destination is already placed into the trip draft. Add another destination or rearrange the current days.
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
              Saved to profile
            </span>
          </div>

          <div className="mt-5 space-y-4">
            <Textarea
              value={plannerNotes}
              onChange={(event) => {
                setPlannerNotes(event.target.value);
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
                  <p
                    className={[
                      "text-sm",
                      saveState === "error"
                        ? "text-[#ff9875]"
                        : "text-[color:var(--brand-3)]"
                    ].join(" ")}
                  >
                    {saveMessage}
                  </p>
                ) : null}
                <Button
                  type="button"
                  variant="app"
                  className="rounded-[18px] px-5"
                  onClick={handleSavePlannerNotes}
                  disabled={saveState === "saving"}
                >
                  {saveState === "saving" ? "Saving..." : "Save notes"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
