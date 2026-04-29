"use client";

import Image from "next/image";
import { Sparkles, ChevronLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Map,
  MapControls,
  MapMarker,
  MapPopup,
  MapRoute,
  MarkerContent,
  MarkerTooltip,
  type MapViewportSnapshot
} from "@/components/ui/map";
import { useTheme } from "@/components/theme-provider";
import type { Destination, Place } from "@/lib/domain";
import { resolveHomeCityOption } from "@/lib/home-city-options";
import { resolvePlaceImageUrl } from "@/lib/place-media";
import { useTripDraft } from "@/lib/use-trip-draft";

type MapPanelProps = {
  destinations: Destination[];
  places: Place[];
  homeCity: string;
};

type FocusLevel = "continent" | "country" | "city" | "district";
type ItineraryFilter = "all" | "trip" | `day:${string}`;

type DetailItem = {
  label: string;
  sublabel: string;
  value: number;
};

type FocusLocation = {
  name: string;
  city: string;
  country: string;
  district: string;
  region: string;
  formattedAddress: string;
};

const DEFAULT_WORLD_CENTER: [number, number] = [0, 20];

const continentByCountry: Record<string, string> = {
  USA: "North America",
  Mexico: "North America",
  France: "Europe",
  UK: "Europe",
  Portugal: "Europe",
  Japan: "Asia",
  "South Korea": "Asia",
  Indonesia: "Asia"
};

function buildDayFilter(dayId: string): ItineraryFilter {
  return `day:${dayId}`;
}

function getDayIdFromFilter(filter: ItineraryFilter) {
  return filter.startsWith("day:") ? filter.slice(4) : null;
}

function parseItineraryFilter(searchParams: ReturnType<typeof useSearchParams>): ItineraryFilter {
  const scope = searchParams.get("scope");
  const dayId = searchParams.get("day");

  if (scope === "day" && dayId) {
    return buildDayFilter(dayId);
  }

  if (scope === "trip") {
    return "trip";
  }

  return "all";
}

function fallbackPlaceImage(place: Place) {
  return resolvePlaceImageUrl(place);
}

function continentFromCountry(country: string) {
  return continentByCountry[country] ?? "Global";
}

function getFocusLevel(zoom: number): FocusLevel {
  if (zoom < 3.2) {
    return "continent";
  }

  if (zoom < 5.6) {
    return "country";
  }

  if (zoom < 9.8) {
    return "city";
  }

  return "district";
}

function withinBounds(place: Place, bounds: MapViewportSnapshot["bounds"]) {
  const { lng, lat } = place.coordinates;
  const crossesDateline = bounds.west > bounds.east;
  const lngMatch = crossesDateline ? lng >= bounds.west || lng <= bounds.east : lng >= bounds.west && lng <= bounds.east;
  return lngMatch && lat >= bounds.south && lat <= bounds.north;
}

function distanceToCenter(place: Place, center: MapViewportSnapshot["center"]) {
  const dx = place.coordinates.lng - center.lng;
  const dy = place.coordinates.lat - center.lat;
  return dx * dx + dy * dy;
}

function groupCount<T>(items: T[], keyFor: (item: T) => string) {
  const counts = new globalThis.Map<string, number>();

  for (const item of items) {
    const key = keyFor(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return counts;
}

function pickDominant<T>(items: T[], keyFor: (item: T) => string) {
  const counts = groupCount(items, keyFor);
  return Array.from(counts.entries()).sort((left, right) => right[1] - left[1])[0]?.[0] ?? "";
}

function extractDistrict(place: Place) {
  const segments = place.address
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);

  for (const segment of segments) {
    const lower = segment.toLowerCase();

    if (lower.includes(place.city.toLowerCase()) || lower.includes(place.country.toLowerCase())) {
      continue;
    }

    const cleaned = segment
      .replace(/^[\d\s./-]+/, "")
      .replace(/\b\d+\b/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    if (cleaned.length >= 3) {
      return cleaned;
    }
  }

  const first = segments[0] ?? place.city;
  return first.replace(/^[\d\s./-]+/, "").trim() || `${place.city} core`;
}

function buildDetailItems(level: FocusLevel, focusPlaces: Place[]): DetailItem[] {
  if (level === "continent") {
    return Array.from(groupCount(focusPlaces, (place) => place.country).entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 4)
      .map(([label, value]) => ({
        label,
        sublabel: `${value} saved spots in frame`,
        value
      }));
  }

  if (level === "country") {
    return Array.from(groupCount(focusPlaces, (place) => place.city).entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 4)
      .map(([label, value]) => ({
        label,
        sublabel: `${value} saved spots in frame`,
        value
      }));
  }

  if (level === "city") {
    return Array.from(groupCount(focusPlaces, (place) => extractDistrict(place)).entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 4)
      .map(([label, value]) => ({
        label,
        sublabel: `${value} saved spots in frame`,
        value
      }));
  }

  return focusPlaces
    .slice()
    .sort((left, right) => right.timesSeen - left.timesSeen)
    .slice(0, 4)
    .map((place) => ({
      label: place.name,
      sublabel: place.category.replace(" ", " · "),
      value: place.timesSeen
    }));
}

function averageCenter(places: Place[]) {
  if (places.length === 0) {
    return null;
  }

  const { lat, lng } = places.reduce(
    (totals, place) => ({
      lat: totals.lat + place.coordinates.lat,
      lng: totals.lng + place.coordinates.lng
    }),
    { lat: 0, lng: 0 }
  );

  return [lng / places.length, lat / places.length] as [number, number];
}

function hasRenderableCoordinates(place: Place) {
  const { lat, lng } = place.coordinates;

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return false;
  }

  if (Math.abs(lat) < 0.000001 && Math.abs(lng) < 0.000001) {
    return false;
  }

  return true;
}

export function MapPanel({ destinations, places, homeCity }: MapPanelProps) {
  const searchParams = useSearchParams();
  const requestedItineraryFilter = parseItineraryFilter(searchParams);
  const requestedCity = searchParams.get("city") ?? "all";
  const { theme } = useTheme();
  const { primaryTrip: selectedTrip, assignPlaceToPrimaryTripDay } = useTripDraft();
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<MapViewportSnapshot | null>(null);
  const [focusLocation, setFocusLocation] = useState<FocusLocation | null>(null);
  const [itineraryFilter, setItineraryFilter] = useState<ItineraryFilter>(requestedItineraryFilter);
  const [cityFilter, setCityFilter] = useState(requestedCity);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const isDark = theme === "dark";
  const hideSidebarTimeoutRef = useRef<number | null>(null);
  const homeCityOption = resolveHomeCityOption(homeCity);
  const mappablePlaces = useMemo(
    () => places.filter((place) => hasRenderableCoordinates(place)),
    [places]
  );
  const itineraryStops = useMemo(() => selectedTrip?.days.flatMap((day) => day.stops) ?? [], [selectedTrip]);
  const tripPlaceIds = useMemo(
    () => new Set(itineraryStops.map((stop) => stop.placeId)),
    [itineraryStops]
  );
  const dayFilterOptions = useMemo(
    () =>
      (selectedTrip?.days ?? []).map((day, index) => {
        const dayPlaces = day.stops
          .map((stop) => mappablePlaces.find((place) => place.id === stop.placeId))
          .filter((place): place is Place => Boolean(place));

        return {
          id: day.id,
          filter: buildDayFilter(day.id),
          label: `Day ${index + 1}`,
          title: day.title,
          city: dayPlaces[0]?.city ?? "",
          count: dayPlaces.length
        };
      }),
    [mappablePlaces, selectedTrip]
  );
  const cityOptions = useMemo(
    () => Array.from(new Set(mappablePlaces.map((place) => place.city))).sort((left, right) => left.localeCompare(right)),
    [mappablePlaces]
  );

  useEffect(() => {
    setItineraryFilter(requestedItineraryFilter);
  }, [requestedItineraryFilter]);

  useEffect(() => {
    if (requestedCity !== "all" && cityOptions.includes(requestedCity)) {
      setCityFilter(requestedCity);
      return;
    }

    setCityFilter("all");
  }, [cityOptions, requestedCity]);

  useEffect(() => {
    const activeDayId = getDayIdFromFilter(itineraryFilter);

    if (!activeDayId) {
      return;
    }

    if (!dayFilterOptions.some((option) => option.id === activeDayId)) {
      setItineraryFilter(selectedTrip ? "trip" : "all");
    }
  }, [dayFilterOptions, itineraryFilter, selectedTrip]);

  const filteredPlaces = useMemo(() => {
    const activeDayId = getDayIdFromFilter(itineraryFilter);
    let nextPlaces = mappablePlaces;

    if (itineraryFilter === "trip") {
      nextPlaces = nextPlaces.filter((place) => tripPlaceIds.has(place.id));
    } else if (activeDayId) {
      const day = selectedTrip?.days.find((item) => item.id === activeDayId);
      const dayPlaceIds = new Set(day?.stops.map((stop) => stop.placeId) ?? []);
      nextPlaces = nextPlaces.filter((place) => dayPlaceIds.has(place.id));
    }

    if (cityFilter !== "all") {
      nextPlaces = nextPlaces.filter((place) => place.city === cityFilter);
    }

    return nextPlaces;
  }, [cityFilter, itineraryFilter, mappablePlaces, selectedTrip, tripPlaceIds]);
  const activeMapPlaces = filteredPlaces;

  const homePlaces = useMemo(() => {
    const source = activeMapPlaces.length > 0 ? activeMapPlaces : mappablePlaces;
    return source.filter((place) => place.city === homeCity);
  }, [activeMapPlaces, homeCity, mappablePlaces]);
  const initialCenter = useMemo<[number, number]>(
    () =>
      homePlaces.length > 0
        ? (averageCenter(homePlaces) ?? DEFAULT_WORLD_CENTER)
        : homeCityOption
          ? [homeCityOption.coordinates.lng, homeCityOption.coordinates.lat]
          : (averageCenter(activeMapPlaces.length > 0 ? activeMapPlaces : mappablePlaces) ?? DEFAULT_WORLD_CENTER),
    [activeMapPlaces, homeCityOption, homePlaces, mappablePlaces]
  );
  const initialZoom =
    activeMapPlaces.length > 0 && activeMapPlaces.length <= 3
      ? 11.2
      : homePlaces.length > 0 || homeCityOption
        ? 9.4
        : 1.8;

  const filteredPlaceIds = useMemo(
    () => new Set(activeMapPlaces.map((place) => place.id)),
    [activeMapPlaces]
  );
  const selectedPopupPlace = activeMapPlaces.find((place) => place.id === selectedPlaceId) ?? null;
  const routeCoordinates = useMemo(
    () =>
      itineraryStops
        .map((stop) => mappablePlaces.find((item) => item.id === stop.placeId))
        .filter((place): place is Place => Boolean(place))
        .filter((place) => filteredPlaceIds.has(place.id))
        .map((place) => [place.coordinates.lng, place.coordinates.lat] as [number, number]),
    [filteredPlaceIds, itineraryStops, mappablePlaces]
  );

  const visiblePlaces = useMemo(() => {
    if (!viewport) {
      return activeMapPlaces;
    }

    const inFrame = activeMapPlaces.filter((place) => withinBounds(place, viewport.bounds));

    if (inFrame.length > 0) {
      return inFrame;
    }

    return activeMapPlaces
      .slice()
      .sort((left, right) => distanceToCenter(left, viewport.center) - distanceToCenter(right, viewport.center))
      .slice(0, 6);
  }, [activeMapPlaces, viewport]);

  useEffect(() => {
    if (!viewport) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/map/focus?lat=${viewport.center.lat}&lng=${viewport.center.lng}`,
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal
          }
        );

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { focus: FocusLocation | null };
        setFocusLocation(data.focus);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setFocusLocation(null);
        }
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [viewport]);

  useEffect(() => {
    if (selectedPlaceId && !filteredPlaceIds.has(selectedPlaceId)) {
      setSelectedPlaceId(null);
    }
  }, [filteredPlaceIds, selectedPlaceId]);

  useEffect(() => {
    setViewport(null);
    setFocusLocation(null);
  }, [cityFilter, itineraryFilter]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsSidebarVisible(false);
    }, 5000);

    hideSidebarTimeoutRef.current = timeoutId;

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  function clearHideSidebarTimeout() {
    if (hideSidebarTimeoutRef.current !== null) {
      window.clearTimeout(hideSidebarTimeoutRef.current);
      hideSidebarTimeoutRef.current = null;
    }
  }

  function scheduleSidebarHide() {
    clearHideSidebarTimeout();
    hideSidebarTimeoutRef.current = window.setTimeout(() => {
      setIsSidebarVisible(false);
    }, 5000);
  }

  function showSidebar() {
    setIsSidebarVisible(true);
    scheduleSidebarHide();
  }

  const zoom = viewport?.zoom ?? initialZoom;
  const focusLevel = getFocusLevel(zoom);
  const nearestVisiblePlace =
    selectedPopupPlace ??
    (viewport
      ? visiblePlaces
          .slice()
          .sort((left, right) => distanceToCenter(left, viewport.center) - distanceToCenter(right, viewport.center))[0]
      : visiblePlaces[0]);
  const focusCountry = focusLocation?.country ?? nearestVisiblePlace?.country ?? homeCityOption?.country ?? "";
  const focusCity = focusLocation?.city ?? nearestVisiblePlace?.city ?? homeCityOption?.value ?? homeCity;
  const focusDistrict = focusLocation?.district || (nearestVisiblePlace ? extractDistrict(nearestVisiblePlace) : `${focusCity} core`);
  const focusContinent = continentFromCountry(focusCountry);

  const focusPlaces = useMemo(() => {
    if (focusLevel === "continent") {
      return activeMapPlaces.filter((place) => continentFromCountry(place.country) === focusContinent);
    }

    if (focusLevel === "country") {
      return activeMapPlaces.filter((place) => place.country === focusCountry);
    }

    if (focusLevel === "city") {
      return activeMapPlaces.filter((place) => place.city === focusCity && place.country === focusCountry);
    }

    return activeMapPlaces.filter(
      (place) => place.city === focusCity && place.country === focusCountry && extractDistrict(place) === focusDistrict
    );
  }, [activeMapPlaces, focusCity, focusContinent, focusCountry, focusDistrict, focusLevel]);

  const activeDestination =
    destinations.find(
      (destination) => destination.name === focusCity && destination.country === focusCountry
    ) ?? null;
  const visibleSignals = focusPlaces.reduce((total, place) => total + place.timesSeen, 0);
  const visibleCountries = new Set(visiblePlaces.map((place) => place.country)).size;
  const visibleCities = new Set(visiblePlaces.map((place) => `${place.city}|${place.country}`)).size;
  const visibleDistricts = new Set(focusPlaces.map((place) => extractDistrict(place))).size;
  const focusTags = Array.from(new Set(focusPlaces.flatMap((place) => place.tags))).slice(0, 3);
  const detailItems = buildDetailItems(focusLevel, focusPlaces);
  const routeStopCount = routeCoordinates.length;

  const focusMeta = {
    continent: {
      label: "Continent focus",
      title: focusContinent || "Global travel field",
      subtitle: `${focusPlaces.length} saved spots from this continent. ${visibleCountries} countries are currently in frame.`
    },
    country: {
      label: "Country focus",
      title: focusCountry || "Country focus",
      subtitle: `${focusPlaces.length} saved spots from this country. ${visibleCities} cities are currently in frame.`
    },
    city: {
      label: "City focus",
      title: focusCountry ? `${focusCity}, ${focusCountry}` : focusCity,
      subtitle:
        activeDestination?.vibe ??
        (focusLocation
          ? `${focusPlaces.length} saved spots match the city at the center of your map.`
          : "Reading the city at the center of your map.")
    },
    district: {
      label: "District focus",
      title: focusDistrict,
      subtitle: focusCountry
        ? `${focusCity}, ${focusCountry} · ${focusPlaces.length} saved spots match this district.`
        : `${focusPlaces.length} saved spots match this district.`
    }
  }[focusLevel];

  const overlaySurfaceClass = isDark
    ? "border-white/12 bg-[rgba(14,18,27,0.74)] shadow-[0_24px_54px_rgba(0,0,0,0.28)]"
    : "border-[color:var(--line)] bg-[color:color-mix(in_srgb,var(--glass-bg-strong)_94%,white_6%)] shadow-[0_20px_40px_rgba(15,23,42,0.10)]";
  const overlayStatClass = isDark
    ? "border-white/10 bg-white/6"
    : "border-[color:var(--line)] bg-[color:color-mix(in_srgb,var(--glass-bg)_88%,white_12%)]";
  const overlayChipClass = isDark
    ? "border-white/12 bg-[rgba(14,18,27,0.68)] text-white/76"
    : "border-[color:var(--line)] bg-[color:color-mix(in_srgb,var(--glass-bg-strong)_92%,white_8%)] text-[color:var(--app-text-soft)]";
  const overlayTextClass = isDark ? "text-white" : "text-[color:var(--app-text)]";
  const overlaySoftTextClass = isDark ? "text-white/66" : "text-[color:var(--app-text-soft)]";
  const overlayMutedTextClass = isDark ? "text-white/52" : "text-[color:var(--app-text-soft)]";

  function quickAddPlace(place: Place) {
    if (!selectedTrip) {
      return;
    }

    const targetDay =
      selectedTrip.days.find((day) => day.stops.length === 0) ??
      selectedTrip.days.reduce((best, day) => (day.stops.length < best.stops.length ? day : best), selectedTrip.days[0]);

    if (targetDay) {
      assignPlaceToPrimaryTripDay(place, targetDay.id);
    }
  }

  return (
    <section className="relative min-h-[calc(100dvh-6.75rem)] overflow-hidden bg-[color:var(--app-card-bg)]">
      <div
        className={[
          "pointer-events-none absolute inset-x-0 top-0 z-10 h-32 bg-gradient-to-b to-transparent",
          isDark ? "from-[rgba(12,16,25,0.42)]" : "from-[rgba(255,250,244,0.12)]"
        ].join(" ")}
      />
      <div
        className={[
          "pointer-events-none absolute inset-x-0 bottom-0 z-10 h-40 bg-gradient-to-t to-transparent",
          isDark ? "from-[rgba(12,16,25,0.36)]" : "from-[rgba(255,250,244,0.18)]"
        ].join(" ")}
      />

      <div
        className="absolute right-0 top-0 z-30 hidden h-full w-8 xl:block"
        onMouseEnter={() => {
          clearHideSidebarTimeout();
          setIsSidebarVisible(true);
        }}
      />

      <div className="absolute left-4 top-4 z-20 flex flex-wrap gap-2 sm:left-6 sm:top-6">
        <div className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] backdrop-blur-xl ${overlayChipClass}`}>
          Live map workspace
        </div>
        <div className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] backdrop-blur-xl ${overlayChipClass}`}>
          {focusMeta.label}
        </div>
        <div className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] backdrop-blur-xl ${overlayChipClass}`}>
          Home base: {homeCityOption?.label ?? homeCity}
        </div>
      </div>

      <div className="relative h-[calc(100dvh-6.75rem)] min-h-[680px] zylo-maplibre">
        <Map
          key={`map-${theme}-${itineraryFilter}-${cityFilter}`}
          center={initialCenter}
          zoom={initialZoom}
          maxZoom={16}
          minZoom={1.5}
          onViewportChange={setViewport}
        >
          {routeCoordinates.length > 1 ? (
            <MapRoute coordinates={routeCoordinates} color="#8b84ff" width={4} opacity={0.82} />
          ) : null}

          {activeMapPlaces.map((place) => {
            const isOnTrip = routeCoordinates.some(
              ([lng, lat]) => lng === place.coordinates.lng && lat === place.coordinates.lat
            );
            const isActive = selectedPopupPlace?.id === place.id;

            return (
              <MapMarker
                key={place.id}
                longitude={place.coordinates.lng}
                latitude={place.coordinates.lat}
                onClick={() => setSelectedPlaceId(place.id)}
              >
                <MarkerContent>
                  <div
                    className={[
                      "relative flex items-center justify-center rounded-full border-2 border-white shadow-[0_16px_34px_rgba(15,23,42,0.28)] transition-transform duration-200 hover:scale-110",
                      isOnTrip
                        ? "h-6 w-6 bg-[color:var(--brand)]"
                        : isActive
                          ? "h-6 w-6 bg-[color:var(--brand-2)]"
                          : "h-5 w-5 bg-[color:var(--brand-3)]"
                    ].join(" ")}
                  >
                    <span className="absolute inset-[5px] rounded-full bg-white/18" />
                  </div>
                </MarkerContent>
                <MarkerTooltip>{place.name}</MarkerTooltip>
              </MapMarker>
            );
          })}

          {selectedPopupPlace ? (
            <MapPopup
              longitude={selectedPopupPlace.coordinates.lng}
              latitude={selectedPopupPlace.coordinates.lat}
              closeButton
              className="w-[280px] p-0"
              onClose={() => setSelectedPlaceId(null)}
            >
              <div className="relative h-36 overflow-hidden rounded-t-[22px]">
                <Image
                  fill
                  src={fallbackPlaceImage(selectedPopupPlace)}
                  alt={selectedPopupPlace.name}
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/72">
                      {selectedPopupPlace.category}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-white">{selectedPopupPlace.name}</h3>
                  </div>
                  <div className="rounded-full bg-white/14 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                    {selectedPopupPlace.timesSeen} saves
                  </div>
                </div>
              </div>
              <div className="space-y-4 p-4">
                <p className="text-sm leading-6 text-[color:var(--app-text-soft)]">
                  {selectedPopupPlace.description ||
                    selectedPopupPlace.address ||
                    `${selectedPopupPlace.city}, ${selectedPopupPlace.country}`}
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedPopupPlace.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="app-pill px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    className="flex-1"
                    onClick={() => quickAddPlace(selectedPopupPlace)}
                  >
                    Add to trip
                  </Button>
                  <Button type="button" size="sm" variant="secondary" onClick={() => setSelectedPlaceId(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </MapPopup>
          ) : null}

          <MapControls position="bottom-right" showZoom showLocate showFullscreen />
        </Map>

        <div className={`pointer-events-none absolute left-4 top-20 z-20 max-w-[320px] rounded-[24px] border px-4 py-4 backdrop-blur-xl sm:left-6 sm:top-24 ${overlaySurfaceClass}`}>
          <div className={`flex items-center gap-2 text-sm font-semibold ${overlayTextClass}`}>
            <Sparkles className="h-4 w-4 text-[#8a92ff]" />
            {focusMeta.label}
          </div>
          <p className={`mt-3 text-xl font-semibold ${overlayTextClass}`}>{focusMeta.title}</p>
          <p className={`mt-2 text-sm leading-6 ${overlaySoftTextClass}`}>{focusMeta.subtitle}</p>
        </div>

        {!isSidebarVisible ? (
          <button
            type="button"
            className={`absolute right-0 top-1/2 z-30 hidden -translate-y-1/2 rounded-l-full border border-r-0 px-2 py-4 backdrop-blur-xl xl:block ${overlaySurfaceClass}`}
            onMouseEnter={() => {
              clearHideSidebarTimeout();
              setIsSidebarVisible(true);
            }}
            aria-label="Show map sidebar"
          >
            <ChevronLeft className="h-4 w-4 text-white" />
          </button>
        ) : null}

        <div
          className={[
            "absolute right-4 top-20 bottom-6 z-20 hidden w-[320px] transition-transform duration-300 xl:block xl:right-6 xl:top-24 xl:bottom-6",
            isSidebarVisible ? "translate-x-0" : "translate-x-[calc(100%+1.5rem)]"
          ].join(" ")}
          onMouseEnter={() => {
            clearHideSidebarTimeout();
            setIsSidebarVisible(true);
          }}
          onMouseLeave={scheduleSidebarHide}
        >
          <div className="h-full space-y-3 overflow-y-auto pb-28 pr-1">
            <div className={`rounded-[24px] border px-4 py-4 backdrop-blur-xl ${overlaySurfaceClass}`}>
              <div className={`flex items-center gap-2 text-sm font-semibold ${overlayTextClass}`}>
                <Sparkles className="h-4 w-4 text-[#8a92ff]" />
                Filter map
              </div>

              <div className="mt-4">
                <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${overlayMutedTextClass}`}>
                  Itinerary
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    { label: "All places", value: "all" as ItineraryFilter },
                    { label: "Current trip", value: "trip" as ItineraryFilter },
                    ...dayFilterOptions.map((option) => ({
                      label: option.label,
                      value: option.filter
                    }))
                  ].map((option) => {
                    const isActive = itineraryFilter === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setItineraryFilter(option.value);
                          showSidebar();
                        }}
                        className={[
                          "rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition",
                          isActive
                            ? "border-transparent bg-[color:var(--brand)] text-white shadow-[0_14px_28px_rgba(28,96,214,0.24)]"
                            : `${overlayStatClass} ${overlaySoftTextClass}`
                        ].join(" ")}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4">
                <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${overlayMutedTextClass}`}>
                  City
                </p>
                <div className="mt-3 flex max-h-[170px] flex-wrap gap-2 overflow-y-auto pr-1">
                  {["all", ...cityOptions].map((option) => {
                    const isActive = cityFilter === option;

                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setCityFilter(option);
                          showSidebar();
                        }}
                        className={[
                          "rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition",
                          isActive
                            ? "border-transparent bg-[color:var(--brand)] text-white shadow-[0_14px_28px_rgba(28,96,214,0.24)]"
                            : `${overlayStatClass} ${overlaySoftTextClass}`
                        ].join(" ")}
                      >
                        {option === "all" ? "All cities" : option}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={`mt-4 rounded-[18px] border px-4 py-3 ${overlayStatClass}`}>
                <p className={`text-[11px] uppercase tracking-[0.18em] ${overlayMutedTextClass}`}>
                  Matches
                </p>
                <p className={`mt-2 text-lg font-semibold ${overlayTextClass}`}>
                  {activeMapPlaces.length} place{activeMapPlaces.length === 1 ? "" : "s"}
                </p>
                {activeMapPlaces.length === 0 ? (
                  <p className={`mt-2 text-xs leading-5 ${overlaySoftTextClass}`}>
                    No places match the current itinerary and city filters. Clear one of them to widen the map.
                  </p>
                ) : null}
              </div>
            </div>

            <div className={`rounded-[24px] border px-4 py-4 backdrop-blur-xl ${overlaySurfaceClass}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${overlayMutedTextClass}`}>
                  In view now
                </p>
                <h3 className={`mt-2 text-3xl ${overlayTextClass}`}>{focusMeta.title}</h3>
                <p className={`mt-2 text-sm leading-6 ${overlaySoftTextClass}`}>
                  {activeDestination?.vibe ?? `${visiblePlaces.length} saved spots are reacting to the current map frame.`}
                </p>
              </div>
              <div className={`h-16 w-16 rounded-[20px] bg-gradient-to-br ${activeDestination?.coverTone ?? "from-sky-400/24 via-indigo-400/16 to-violet-500/24"}`} />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                { label: "Visible spots", value: String(focusPlaces.length) },
                { label: "Signal saves", value: String(visibleSignals) },
                {
                  label: focusLevel === "continent" ? "Countries" : focusLevel === "country" ? "Cities" : "Districts",
                  value: String(focusLevel === "continent" ? visibleCountries : focusLevel === "country" ? visibleCities : visibleDistricts)
                },
                { label: "Trip stops", value: String(routeStopCount) }
              ].map((stat) => (
                <div key={stat.label} className={`rounded-[20px] border px-4 py-4 ${overlayStatClass}`}>
                  <p className={`text-[11px] uppercase tracking-[0.18em] ${overlayMutedTextClass}`}>{stat.label}</p>
                  <p className={`mt-2 text-2xl font-black ${overlayTextClass}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {(focusTags.length > 0 ? focusTags : activeDestination?.spotlightTags ?? []).slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] ${overlayStatClass} ${overlaySoftTextClass}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

            <div className={`rounded-[24px] border px-4 py-4 backdrop-blur-xl ${overlaySurfaceClass}`}>
              <div className={`flex items-center gap-2 text-sm font-semibold ${overlayTextClass}`}>
                <Sparkles className="h-4 w-4 text-[#8a92ff]" />
                {focusLevel === "continent"
                  ? "Countries in frame"
                  : focusLevel === "country"
                    ? "Cities in frame"
                    : focusLevel === "city"
                      ? "Districts in frame"
                      : "Places in district"}
              </div>
              <div className="mt-4 space-y-3">
                {detailItems.map((item, index) => (
                  <div
                    key={`${item.label}-${index}`}
                    className={`flex items-center justify-between gap-3 rounded-[18px] border px-4 py-3 ${overlayStatClass}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-2xl border text-sm font-black ${overlayStatClass} ${overlayTextClass}`}>
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <div>
                        <p className={`font-semibold ${overlayTextClass}`}>{item.label}</p>
                        <p className={`mt-1 text-xs ${overlaySoftTextClass}`}>{item.sublabel}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-black ${overlayTextClass}`}>{item.value}</p>
                      <p className={`text-[10px] uppercase tracking-[0.18em] ${overlayMutedTextClass}`}>
                        {focusLevel === "district" ? "saves" : "spots"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-4 bottom-4 z-20 sm:inset-x-6 xl:inset-x-auto xl:bottom-6 xl:left-6 xl:right-[388px]">
          <div className={`rounded-[26px] border px-4 py-4 backdrop-blur-xl ${overlaySurfaceClass}`}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${overlayMutedTextClass}`}>Viewport signal</p>
                <p className={`mt-2 text-xl font-semibold ${overlayTextClass}`}>{focusMeta.title}</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  `${visiblePlaces.length} spots in frame`,
                  `${visibleSignals} save signals`,
                  `zoom ${zoom.toFixed(1)}`
                ].map((item) => (
                  <div
                    key={item}
                    className={`rounded-full border px-3 py-2 text-center text-xs font-medium ${overlayStatClass} ${overlaySoftTextClass}`}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
