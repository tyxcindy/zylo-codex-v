import { recordAuditEvent } from "@/lib/audit";

type SupabaseLike = Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>;

export function buildPlaceStateUpdates(input: {
  isVisited?: boolean;
  isInTrip?: boolean;
}) {
  const updates: Record<string, boolean> = {};

  if (typeof input.isVisited === "boolean") {
    updates.is_visited = input.isVisited;
  }

  if (typeof input.isInTrip === "boolean") {
    updates.is_in_trip = input.isInTrip;
  }

  return updates;
}

export type UpdatePlaceSaveStateResult =
  | {
      ok: true;
      status: 200;
      place: unknown;
    }
  | {
      ok: false;
      status: 404;
      error: string;
    };

export async function updatePlaceSaveState(input: {
  supabase: SupabaseLike;
  userId: string;
  placeId: string;
  ip: string;
  isVisited?: boolean;
  isInTrip?: boolean;
}): Promise<UpdatePlaceSaveStateResult> {
  const updates = buildPlaceStateUpdates({
    isVisited: input.isVisited,
    isInTrip: input.isInTrip
  });

  const { data: place, error } = await input.supabase
    .from("places")
    .update(updates)
    .eq("id", input.placeId)
    .eq("user_id", input.userId)
    .select("id, name, city, country, category, address, description, latitude, longitude, times_seen, source_count, is_visited, is_in_trip, tags")
    .single();

  if (error || !place) {
    return {
      ok: false,
      status: 404,
      error: "Place not found."
    };
  }

  await recordAuditEvent({
    userId: input.userId,
    eventType: "api",
    message: "Place save state updated",
    severity: "info",
    metadata: { ip: input.ip, placeId: input.placeId }
  });

  return {
    ok: true,
    status: 200,
    place
  };
}
