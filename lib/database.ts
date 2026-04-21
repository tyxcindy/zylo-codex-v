import { demoUser, tasteProfile as demoTasteProfile } from "@/lib/data";
import type { PlaceCategory } from "@/lib/domain";

type SupabaseLike = Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>;

export async function ensureProfileForUser(
  supabase: SupabaseLike,
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }
) {
  const displayName =
    typeof user.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name
      : demoUser.displayName;
  const homeCity =
    typeof user.user_metadata?.home_city === "string"
      ? user.user_metadata.home_city
      : demoUser.homeCity;

  await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      email: user.email ?? "",
      display_name: displayName,
      home_city: homeCity
    },
    { onConflict: "user_id" }
  );

  await supabase.from("taste_profiles").upsert(
    {
      user_id: user.id,
      priorities: demoTasteProfile.priorities,
      favorite_cuisines: demoTasteProfile.favoriteCuisines,
      avoids: demoTasteProfile.avoids
    },
    { onConflict: "user_id" }
  );
}

export async function upsertDestination(
  supabase: SupabaseLike,
  input: { userId: string; name: string; country: string }
) {
  const { data: existing } = await supabase
    .from("destinations")
    .select("id")
    .eq("user_id", input.userId)
    .eq("name", input.name)
    .eq("country", input.country)
    .maybeSingle();

  if (existing) {
    return existing.id as string;
  }

  const { data, error } = await supabase
    .from("destinations")
    .insert({
      user_id: input.userId,
      name: input.name,
      country: input.country,
      vibe: "Imported from saved travel content",
      cover_tone: "from-amber-300/30 via-rose-400/20 to-indigo-500/20"
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data.id as string;
}

export async function upsertPlace(
  supabase: SupabaseLike,
  input: {
    userId: string;
    destinationId: string;
    sourceArtifactId: string;
    googlePlaceId?: string | null;
    name: string;
    city: string;
    country: string;
    category: PlaceCategory;
    address: string;
    description: string;
    latitude?: number | null;
    longitude?: number | null;
    tags: string[];
  }
) {
  const { data: existing } = await supabase
    .from("places")
    .select("id, times_seen, source_count")
    .eq("user_id", input.userId)
    .eq("name", input.name)
    .eq("city", input.city)
    .eq("country", input.country)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("places")
      .update({
        destination_id: input.destinationId,
        source_artifact_id: input.sourceArtifactId,
        google_place_id: input.googlePlaceId ?? null,
        address: input.address,
        description: input.description,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        category: input.category,
        tags: input.tags,
        times_seen: Number(existing.times_seen ?? 1) + 1,
        source_count: Number(existing.source_count ?? 1) + 1
      })
      .eq("id", existing.id)
      .eq("user_id", input.userId)
      .select("id, name, city, country, category, address, description, latitude, longitude, times_seen, source_count, is_visited, is_in_trip, tags")
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  const { data, error } = await supabase
    .from("places")
    .insert({
      user_id: input.userId,
      destination_id: input.destinationId,
      source_artifact_id: input.sourceArtifactId,
      google_place_id: input.googlePlaceId ?? null,
      name: input.name,
      city: input.city,
      country: input.country,
      category: input.category,
      address: input.address,
      description: input.description,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      tags: input.tags
    })
    .select("id, name, city, country, category, address, description, latitude, longitude, times_seen, source_count, is_visited, is_in_trip, tags")
    .single();

  if (error) {
    throw error;
  }

  return data;
}
