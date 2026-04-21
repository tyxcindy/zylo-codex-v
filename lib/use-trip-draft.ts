"use client";

import { useEffect, useState } from "react";

import type { Place, Trip } from "@/lib/domain";
import { trips as seedTrips } from "@/lib/data";

const STORAGE_KEY = "zylo.trip-draft.v1";

function cloneSeedTrips(): Trip[] {
  return seedTrips.map((trip) => ({
    ...trip,
    days: trip.days.map((day) => ({
      ...day,
      stops: day.stops.map((stop) => ({ ...stop }))
    }))
  }));
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

export function useTripDraft() {
  const [tripState, setTripState] = useState<Trip[]>(() => cloneSeedTrips());
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);

      if (stored) {
        const parsed = JSON.parse(stored);

        if (looksLikeTripArray(parsed)) {
          setTripState(parsed);
        }
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
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

  function reorderPrimaryTripDay(activeDayId: string, targetDayId: string) {
    setTripState((currentTrips) =>
      currentTrips.map((trip, index) =>
        index === 0
          ? {
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
            }
          : trip
      )
    );
  }

  function assignPlaceToPrimaryTripDay(place: Place, targetDayId: string) {
    setTripState((currentTrips) =>
      currentTrips.map((trip, index) => {
        if (index !== 0) {
          return trip;
        }

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
      })
    );
  }

  return {
    tripState,
    setTripState,
    primaryTrip: tripState[0] ?? null,
    reorderPrimaryTripDay,
    assignPlaceToPrimaryTripDay
  };
}
