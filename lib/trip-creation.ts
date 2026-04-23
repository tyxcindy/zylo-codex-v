import { recordAuditEvent } from "@/lib/audit";

type SupabaseLike = Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>;
type TripInput = import("zod").infer<typeof import("@/lib/validation").tripSchema>;

export type CreateTripResult =
  | {
      ok: true;
      status: 201;
      trip: unknown;
    }
  | {
      ok: false;
      status: 404 | 500;
      error: string;
    };

export async function createTrip(input: {
  supabase: SupabaseLike;
  userId: string;
  ip: string;
  payload: TripInput;
}): Promise<CreateTripResult> {
  const { data: destination } = await input.supabase
    .from("destinations")
    .select("id")
    .eq("id", input.payload.destinationId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (!destination) {
    return {
      ok: false,
      status: 404,
      error: "Destination not found."
    };
  }

  const { data: trip, error } = await input.supabase
    .from("trips")
    .insert({
      user_id: input.userId,
      destination_id: input.payload.destinationId,
      title: input.payload.title,
      status: "draft",
      vibe: input.payload.vibe,
      travelers: input.payload.travelers
    })
    .select("id, destination_id, title, status, vibe, travelers")
    .single();

  if (error) {
    return {
      ok: false,
      status: 500,
      error: "Unable to create trip."
    };
  }

  await recordAuditEvent({
    userId: input.userId,
    eventType: "api",
    message: "Trip created",
    severity: "info",
    metadata: { ip: input.ip, tripId: trip.id }
  });

  return {
    ok: true,
    status: 201,
    trip
  };
}
