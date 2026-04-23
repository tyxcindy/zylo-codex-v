import {
  demoUser,
  destinations as demoDestinations,
  places as demoPlaces,
  sourceArtifacts as demoArtifacts,
  trips as demoTrips
} from "@/lib/data";
import type { Destination, Place, SourceArtifact, Trip, UserProfileSummary } from "@/lib/domain";
import { resolveHomeCityOption } from "@/lib/home-city-options";
import { resolvePlaceImageUrl } from "@/lib/place-media";
import { normalizeSavedPlace } from "@/lib/place-quality";

type SupabaseLike = Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>;

const coverTones = [
  "from-emerald-400/24 via-cyan-300/14 to-sky-400/20",
  "from-violet-500/30 via-indigo-400/12 to-sky-400/24",
  "from-orange-400/24 via-rose-400/18 to-violet-500/20",
  "from-fuchsia-400/24 via-amber-300/16 to-orange-300/24",
  "from-sky-400/22 via-cyan-300/18 to-indigo-400/20"
] as const;

const destinationFallbackImages: Record<string, string> = {
  cafes:
    "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80",
  restaurants:
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
  bars:
    "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80",
  hotels:
    "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1200&q=80",
  activities:
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
  "photo spots":
    "https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?auto=format&fit=crop&w=1200&q=80",
  "scenic spots":
    "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80"
};

function pickCoverTone(index: number, tone?: string | null) {
  return tone && tone.trim().length > 0 ? tone : coverTones[index % coverTones.length];
}

function pickDestinationImage(
  destination: { name: string; country: string },
  destinationPlaces: Place[]
) {
  const placeWithImage = destinationPlaces.find((place) => place.imageUrl);
  if (placeWithImage?.imageUrl) {
    return placeWithImage.imageUrl;
  }

  const fallbackByCategory = destinationPlaces.find(
    (place) => destinationFallbackImages[place.category]
  );
  if (fallbackByCategory) {
    return destinationFallbackImages[fallbackByCategory.category];
  }

  const demoMatch = demoDestinations.find(
    (candidate) =>
      candidate.name.toLowerCase() === destination.name.toLowerCase() &&
      candidate.country.toLowerCase() === destination.country.toLowerCase()
  );
  if (demoMatch?.imageUrl) {
    return demoMatch.imageUrl;
  }

  return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80";
}

function mapPlace(row: any): Place | null {
  const normalizedPlace = normalizeSavedPlace({
    name: row.name,
    city: row.city,
    country: row.country
  });

  if (!normalizedPlace) {
    return null;
  }

  return {
    id: row.id,
    destinationId: row.destination_id ?? "",
    name: normalizedPlace.name,
    city: row.city,
    country: row.country,
    category: row.category,
    address: row.address ?? "",
    description: row.description ?? "",
    coordinates: {
      lat: Number(row.latitude ?? 0),
      lng: Number(row.longitude ?? 0)
    },
    timesSeen: Number(row.times_seen ?? 1),
    sourceCount: Number(row.source_count ?? 1),
    isVisited: Boolean(row.is_visited),
    isInTrip: Boolean(row.is_in_trip),
    tags: Array.isArray(row.tags) ? row.tags : [],
    imageUrl: resolvePlaceImageUrl({
      category: row.category,
      imageUrl: row.image_url ?? undefined
    })
  };
}

function mapArtifact(row: any): SourceArtifact {
  return {
    id: row.id,
    type: row.type,
    label: row.label,
    status: row.status,
    createdAt: row.created_at,
    extractedPlaces: Number(row.extracted_places ?? 0)
  };
}

export async function getUserLibrarySnapshot(
  supabase: SupabaseLike,
  userId: string
): Promise<{
  destinations: Destination[];
  places: Place[];
  sourceArtifacts: SourceArtifact[];
  trips: Trip[];
  profile: UserProfileSummary;
}> {
  const [
    { data: destinationsData },
    { data: placesData },
    { data: artifactsData },
    { data: importJobsData },
    { data: profileData }
  ] =
    await Promise.all([
      supabase
        .from("destinations")
        .select("id, name, country, vibe, cover_tone, is_local, created_at")
        .eq("user_id", userId)
        .order("is_local", { ascending: false })
        .order("name", { ascending: true }),
      supabase
        .from("places")
        .select(
          "id, destination_id, name, city, country, category, address, description, latitude, longitude, image_url, times_seen, source_count, is_visited, is_in_trip, tags, created_at"
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("source_artifacts")
        .select("id, type, label, status, created_at, extracted_places")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("import_jobs")
        .select("source_artifact_id, error_message, status")
        .eq("user_id", userId),
      supabase
        .from("profiles")
        .select("display_name, email, home_city, planner_notes")
        .eq("user_id", userId)
        .maybeSingle()
    ]);

  const places = (placesData ?? [])
    .map((row) => mapPlace(row))
    .filter((place): place is Place => Boolean(place));
  const shouldUseDemoLibrary = places.length === 0 && (destinationsData?.length ?? 0) === 0;
  const libraryPlaces = shouldUseDemoLibrary ? demoPlaces : places;
  const placesByDestination = new Map<string, Place[]>();

  for (const place of libraryPlaces) {
    const list = placesByDestination.get(place.destinationId) ?? [];
    list.push(place);
    placesByDestination.set(place.destinationId, list);
  }

  const destinations = shouldUseDemoLibrary
    ? demoDestinations
    : (destinationsData ?? [])
        .filter((row) => {
          const destinationPlaces = placesByDestination.get(row.id) ?? [];
          return Boolean(row.is_local) || destinationPlaces.length > 0;
        })
        .map((row, index) => {
        const destinationPlaces = placesByDestination.get(row.id) ?? [];
        const spotlightTags = Array.from(
          new Set(destinationPlaces.flatMap((place) => place.tags))
        ).slice(0, 3);

        return {
          id: row.id,
          name: row.name,
          country: row.country,
          vibe: row.vibe || "Imported from saved travel content.",
          placeCount: destinationPlaces.length,
          coverTone: pickCoverTone(index, row.cover_tone),
          imageUrl: pickDestinationImage({ name: row.name, country: row.country }, destinationPlaces),
          spotlightTags
        } satisfies Destination;
      });

  const jobErrors = new Map<string, { errorMessage?: string | null; status?: string | null }>();
  for (const row of importJobsData ?? []) {
    jobErrors.set(row.source_artifact_id, {
      errorMessage: row.error_message,
      status: row.status
    });
  }

  const sourceArtifacts =
    artifactsData && artifactsData.length > 0
      ? artifactsData.map((row) => {
          const artifact = mapArtifact(row);
          const job = jobErrors.get(row.id);
          return {
            ...artifact,
            status: (job?.status as SourceArtifact["status"] | undefined) ?? artifact.status,
            errorMessage: job?.errorMessage ?? undefined
          };
        })
      : demoArtifacts;

  return {
    destinations,
    places: libraryPlaces,
    sourceArtifacts,
    trips: demoTrips,
    profile: {
      displayName: profileData?.display_name ?? demoUser.displayName,
      email: profileData?.email ?? demoUser.email,
      homeCity: resolveHomeCityOption(profileData?.home_city ?? demoUser.homeCity)?.value ?? (profileData?.home_city ?? demoUser.homeCity),
      plannerNotes: profileData?.planner_notes ?? ""
    }
  };
}
