import { recordAuditEvent } from "@/lib/audit";
import type { tripGenerateSchema } from "@/lib/validation";

type SupabaseLike = Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>;
type TripGenerateInput = import("zod").infer<typeof tripGenerateSchema>;

type TripRecord = {
  id: string;
  destination_id: string;
  title: string;
  status: string;
};

export type GenerateTripResult =
  | {
      ok: true;
      status: 200;
      trip: TripRecord & { status: "ready" };
      message: string;
    }
  | {
      ok: false;
      status: 404;
      error: string;
    };

export async function loadTripForGeneration(input: {
  supabase: SupabaseLike;
  userId: string;
  tripId: string;
}) {
  const result = await input.supabase
    .from("trips")
    .select("id, destination_id, title, status")
    .eq("id", input.tripId)
    .eq("user_id", input.userId)
    .maybeSingle();

  return (result.data as TripRecord | null) ?? null;
}

export async function ensureGeneratedTripDay(input: {
  supabase: SupabaseLike;
  userId: string;
  tripId: string;
}) {
  const { data: existingDays } = await input.supabase
    .from("trip_days")
    .select("id")
    .eq("trip_id", input.tripId)
    .eq("user_id", input.userId)
    .limit(1);

  if (!existingDays?.length) {
    await input.supabase.from("trip_days").insert({
      user_id: input.userId,
      trip_id: input.tripId,
      title: "Generated day 1",
      sort_order: 1
    });
  }
}

export async function generateTripDraft(input: {
  supabase: SupabaseLike;
  userId: string;
  tripId: string;
  ip: string;
  payload: TripGenerateInput;
}): Promise<GenerateTripResult> {
  const trip = await loadTripForGeneration({
    supabase: input.supabase,
    userId: input.userId,
    tripId: input.tripId
  });

  if (!trip) {
    return {
      ok: false,
      status: 404,
      error: "Trip not found."
    };
  }

  await ensureGeneratedTripDay({
    supabase: input.supabase,
    userId: input.userId,
    tripId: trip.id
  });

  await input.supabase
    .from("trips")
    .update({ status: "ready" })
    .eq("id", trip.id)
    .eq("user_id", input.userId);

  await recordAuditEvent({
    userId: input.userId,
    eventType: "ai",
    message: "Trip generation requested",
    severity: "info",
    metadata: { ip: input.ip, tripId: trip.id }
  });

  return {
    ok: true,
    status: 200,
    trip: {
      ...trip,
      status: "ready"
    },
    message:
      "Trip draft generated. This beta route creates a first itinerary day and marks the trip ready."
  };
}
