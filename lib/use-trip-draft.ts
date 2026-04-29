"use client";

import { useEffect, useState } from "react";

import type { Destination, Place, Trip } from "@/lib/domain";
import { destinations as seedDestinations, trips as seedTrips } from "@/lib/data";

const STORAGE_KEY = "zylo.trip-draft.v1";
const ACTIVE_TRIP_STORAGE_KEY = "zylo.trip-draft.active-trip.v1";
const MIN_TRIP_DAYS = 1;
const MAX_TRIP_DAYS = 21;
const MIN_TRAVELERS = 1;
const MAX_TRAVELERS = 12;

function cloneSeedTrips(): Trip[] {
  return seedTrips.map((trip) => normalizeTrip(trip));
}

function normalizeTrip(trip: Trip): Trip {
  return {
    ...trip,
    plannerNotes: trip.plannerNotes ?? "",
    days: trip.days.map((day) => ({
      ...day,
      stops: day.stops.map((stop) => ({ ...stop }))
    }))
  };
}

function looksLikeTripArray(value: unknown): value is Trip[] {
  return (
    Array.isArray(value) &&
    value.every(
      (trip) =>
        typeof trip === "object" &&
        trip !== null &&
        "id" in trip &&
        "days" in trip &&
        Array.isArray(trip.days)
    )
  );
}

function createStopMeta(place: Place) {
  switch (place.category) {
    case "cafes":
      return { time: "09:00 AM", note: "Coffee" };
    case "restaurants":
      return { time: "12:30 PM", note: "Food" };
    case "bars":
      return { time: "08:00 PM", note: "Drinks" };
    case "hotels":
      return { time: "03:00 PM", note: "Stay" };
    case "photo spots":
      return { time: "06:00 PM", note: "Photo" };
    case "scenic spots":
      return { time: "05:30 PM", note: "Scenic" };
    case "activities":
    default:
      return { time: "02:00 PM", note: "Activity" };
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createEmptyDay(dayNumber: number) {
  return {
    id: createId("day"),
    title: `Open day ${dayNumber}`,
    stops: []
  };
}

function createTripDraft(destination?: Destination): Trip {
  const selectedDestination = destination ?? seedDestinations[0];
  const tripNumber = seedTrips.length + 1;

  return {
    id: createId("trip"),
    title: selectedDestination ? `${selectedDestination.name} Draft` : `Trip ${tripNumber}`,
    destinationId: selectedDestination?.id ?? "",
    status: "draft",
    vibe: selectedDestination?.vibe ?? "Flexible itinerary draft",
    travelers: 1,
    plannerNotes: "",
    imageUrl: selectedDestination?.imageUrl,
    days: [createEmptyDay(1), createEmptyDay(2), createEmptyDay(3)]
  };
}

export function useTripDraft() {
  const [tripState, setTripState] = useState<Trip[]>(() => cloneSeedTrips());
  const [activeTripId, setActiveTripId] = useState<string | null>(() => seedTrips[0]?.id ?? null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const storedActiveTripId = window.localStorage.getItem(ACTIVE_TRIP_STORAGE_KEY);

      if (stored) {
        const parsed = JSON.parse(stored);

        if (looksLikeTripArray(parsed)) {
          const normalizedTrips = parsed.map((trip) => normalizeTrip(trip));

          setTripState(normalizedTrips);
          setActiveTripId(
            storedActiveTripId && normalizedTrips.some((trip) => trip.id === storedActiveTripId)
              ? storedActiveTripId
              : normalizedTrips[0]?.id ?? null
          );
          return;
        }
      }

      setActiveTripId(seedTrips[0]?.id ?? null);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(ACTIVE_TRIP_STORAGE_KEY);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tripState));
  }, [isHydrated, tripState]);

  useEffect(() => {
    if (!isHydrated || !activeTripId) {
      return;
    }

    window.localStorage.setItem(ACTIVE_TRIP_STORAGE_KEY, activeTripId);
  }, [activeTripId, isHydrated]);

  function updateActiveTrip(
    updater: (trip: Trip) => Trip
  ) {
    if (!activeTripId) {
      return;
    }

    setTripState((currentTrips) =>
      currentTrips.map((trip) => (trip.id === activeTripId ? updater(trip) : trip))
    );
  }

  function reorderPrimaryTripDay(activeDayId: string, targetDayId: string) {
    updateActiveTrip((trip) => ({
      ...trip,
      days: (() => {
        const fromIndex = trip.days.findIndex((day) => day.id === activeDayId);
        const toIndex = trip.days.findIndex((day) => day.id === targetDayId);

        if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
          return trip.days;
        }

        const nextDays = [...trip.days];
        const [movedDay] = nextDays.splice(fromIndex, 1);

        if (!movedDay) {
          return trip.days;
        }

        nextDays.splice(toIndex, 0, movedDay);
        return nextDays;
      })()
    }));
  }

  function addPrimaryTripDay() {
    updateActiveTrip((trip) => ({
      ...trip,
      days: [...trip.days, createEmptyDay(trip.days.length + 1)]
    }));
  }

  function removePrimaryTripDay(dayId: string) {
    updateActiveTrip((trip) => {
      if (trip.days.length <= MIN_TRIP_DAYS) {
        return trip;
      }

      return {
        ...trip,
        days: trip.days.filter((day) => day.id !== dayId)
      };
    });
  }

  function removePlaceFromPrimaryTrip(placeId: string) {
    updateActiveTrip((trip) => ({
      ...trip,
      days: trip.days.map((day) => {
        const nextStops = day.stops.filter((stop) => stop.placeId !== placeId);

        return {
          ...day,
          title: nextStops.length === 0 ? "Open day" : day.title,
          stops: nextStops
        };
      })
    }));
  }

  function assignPlaceToPrimaryTripDay(place: Place, targetDayId: string) {
    updateActiveTrip((trip) => {
      let movedStop:
        | {
            id: string;
            placeId: string;
            time: string;
            note: string;
          }
        | null = null;

      const daysWithoutPlace = trip.days.map((day) => {
        const matchedStop = day.stops.find((stop) => stop.placeId === place.id);

        if (matchedStop) {
          movedStop = matchedStop;
        }

        const nextStops = day.stops.filter((stop) => stop.placeId !== place.id);

        return {
          ...day,
          title: nextStops.length === 0 ? "Open day" : day.title,
          stops: nextStops
        };
      });

      return {
        ...trip,
        days: daysWithoutPlace.map((day) => {
          if (day.id !== targetDayId) {
            return day;
          }

          const nextStop =
            movedStop ??
            (() => {
              const defaults = createStopMeta(place);

              return {
                id: `stop_${place.id}`,
                placeId: place.id,
                time: defaults.time,
                note: defaults.note
              };
            })();

          const nextStops = [...day.stops, nextStop];

          return {
            ...day,
            title: day.title === "Open day" || day.stops.length === 0 ? place.name : day.title,
            stops: nextStops
          };
        })
      };
    });
  }

  function setPrimaryTripDayCount(dayCount: number) {
    const safeDayCount = clamp(dayCount, MIN_TRIP_DAYS, MAX_TRIP_DAYS);

    updateActiveTrip((trip) => {
      if (safeDayCount === trip.days.length) {
        return {
          ...trip,
          days: trip.days
        };
      }

      if (safeDayCount > trip.days.length) {
        const newDays = Array.from({ length: safeDayCount - trip.days.length }, (_, offset) =>
          createEmptyDay(trip.days.length + offset + 1)
        );

        return {
          ...trip,
          days: [...trip.days, ...newDays]
        };
      }

      return {
        ...trip,
        days: trip.days.slice(0, safeDayCount)
      };
    });
  }

  function setPrimaryTripTravelers(travelers: number) {
    const safeTravelers = clamp(travelers, MIN_TRAVELERS, MAX_TRAVELERS);

    updateActiveTrip((trip) => ({
      ...trip,
      travelers: safeTravelers
    }));
  }

  function createTrip(destination?: Destination) {
    const nextTrip = createTripDraft(destination);

    setTripState((currentTrips) => [nextTrip, ...currentTrips]);
    setActiveTripId(nextTrip.id);
  }

  function deleteTrip(tripId: string) {
    let nextActiveTripId = activeTripId;

    setTripState((currentTrips) => {
      const nextTrips = currentTrips.filter((trip) => trip.id !== tripId);

      if (nextTrips.length === 0) {
        const fallbackTrip = createTripDraft(seedDestinations[0]);
        nextActiveTripId = fallbackTrip.id;
        return [fallbackTrip];
      }

      if (activeTripId === tripId) {
        nextActiveTripId = nextTrips[0]?.id ?? null;
      }

      return nextTrips;
    });

    if (nextActiveTripId !== activeTripId) {
      setActiveTripId(nextActiveTripId);
    }
  }

  function setActiveTrip(tripId: string) {
    setActiveTripId(tripId);
  }

  function updateActiveTripDestination(destination: Destination) {
    updateActiveTrip((trip) => ({
      ...trip,
      title: `${destination.name} Draft`,
      destinationId: destination.id,
      vibe: destination.vibe,
      imageUrl: destination.imageUrl,
      days: trip.days.map((day) => ({
        ...day,
        title: "Open day",
        stops: []
      }))
    }));
  }

  function updateActiveTripNotes(plannerNotes: string) {
    updateActiveTrip((trip) => ({
      ...trip,
      plannerNotes
    }));
  }

  const activeTrip = tripState.find((trip) => trip.id === activeTripId) ?? tripState[0] ?? null;

  return {
    tripState,
    setTripState,
    activeTrip,
    primaryTrip: activeTrip,
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
    limits: {
      minTripDays: MIN_TRIP_DAYS,
      maxTripDays: MAX_TRIP_DAYS,
      minTravelers: MIN_TRAVELERS,
      maxTravelers: MAX_TRAVELERS
    }
  };
}
