import { demoUser, sourceArtifacts as demoArtifacts, trips as demoTrips } from "@/lib/data";
import type { Destination, Place, SourceArtifact, Trip, UserProfileSummary } from "@/lib/domain";

type SupabaseLike = Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>;

const coverTones = [
  "from-emerald-400/24 via-cyan-300/14 to-sky-400/20",
  "from-violet-500/30 via-indigo-400/12 to-sky-400/24",
  "from-orange-400/24 via-rose-400/18 to-violet-500/20",
  "from-fuchsia-400/24 via-amber-300/16 to-orange-300/24",
  "from-sky-400/22 via-cyan-300/18 to-indigo-400/20"
] as const;

function pickCoverTone(index: number, tone?: string | null) {
  return tone && tone.trim().length > 0 ? tone : coverTones[index % coverTones.length];
}

function mapPlace(row: any): Place {
  return {
    id: row.id,
    destinationId: row.destination_id ?? "",
    name: row.name,
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
    tags: Array.isArray(row.tags) ? row.tags : []
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
          "id, destination_id, name, city, country, category, address, description, latitude, longitude, times_seen, source_count, is_visited, is_in_trip, tags, created_at"
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

  const places = (placesData ?? []).map(mapPlace);
  const placesByDestination = new Map<string, Place[]>();

  for (const place of places) {
    const list = placesByDestination.get(place.destinationId) ?? [];
    list.push(place);
    placesByDestination.set(place.destinationId, list);
  }

  const destinations = (destinationsData ?? []).map((row, index) => {
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
    places,
    sourceArtifacts,
    trips: demoTrips,
    profile: {
      displayName: profileData?.display_name ?? demoUser.displayName,
      email: profileData?.email ?? demoUser.email,
      homeCity: profileData?.home_city ?? demoUser.homeCity,
      plannerNotes: profileData?.planner_notes ?? ""
    }
  };
}
